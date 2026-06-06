---
name: grammar-practice
description: |
  Creates explicit grammar instruction with explanation, exercises, and self-correction for one grammar point at a time for language learners. Produces a complete grammar lesson with practice activities.
  Use when a learner asks to practice a grammar rule, understand a grammar concept, or do grammar exercises in a target language.
  Do NOT use for vocabulary building (use `vocabulary-building`), for conversation practice (use `conversation-practice`), or for general language assessment (use `language-level-assessment`).
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
# Grammar Practice

## When to Use

Use this skill when a learner explicitly requests instruction, explanation, or exercises targeting a **specific grammar structure** in a target language. Concrete trigger scenarios include:

- A learner says "I never understand when to use the subjunctive in Spanish -- can you explain it and give me exercises?"
- A learner is preparing for a DELF, JLPT, IELTS, or DELE exam and needs focused practice on one tested grammar structure
- A learner has received corrected writing and wants to understand and drill the specific rule they keep breaking (e.g., "My teacher always corrects my use of the present perfect -- can we work on that?")
- A learner is moving from receptive to productive grammar knowledge -- they recognize a structure when reading but cannot produce it spontaneously
- A learner requests progressive exercises on a specific grammar rule, from recognition through free writing

**Do NOT use when:**

- The learner wants to build vocabulary (use `vocabulary-building` -- grammar lessons are the wrong frame for acquiring lexical items)
- The learner wants to have a conversation and receive corrections in context (use `conversation-practice` -- that skill integrates grammar feedback without explicit drilling)
- The learner needs their overall language level assessed to know where to begin (use `language-level-assessment` -- grammar practice assumes a known target point)
- The learner wants pronunciation coaching -- grammar drilling does not address phonological errors
- The learner is an educator creating curriculum for a class -- this skill produces learner-facing materials, not teacher guides or scope-and-sequence documents
- The learner has not identified a specific grammar point -- if the request is "help me with my grammar in general," use `language-level-assessment` first to identify the priority structure
- The learner wants help with writing style or register rather than grammatical accuracy (use a writing-feedback skill)
- The grammar point involves script or writing system instruction (e.g., learning hiragana) -- that is an orthography task, not a grammar task

---

## Process

### 1. Identify and Scope the Exact Grammar Point

Before producing any content, confirm the single grammar structure to teach. Vague requests must be narrowed.

- Ask: "Which specific form are you working on?" If the learner says "verb tenses," ask them to name one: "past simple," "imperfect vs. preterite," "conditional perfect," etc.
- Map the stated grammar point to a **CEFR level band** (A1--C2) using standard reference grids (e.g., the English Grammar Profile, Spanish grammar progression norms). This determines vocabulary of explanation and exercise complexity.
- Confirm the **target language** and the learner's **L1 (first language)**. Transfer errors from L1 are the most predictable mistake source -- a Japanese L1 speaker learning English articles faces different challenges than a French L1 speaker.
- Identify whether the learner needs **receptive competence** (reading and recognizing the structure), **controlled production** (filling blanks, transforming sentences), or **free production** (original writing). Ask directly: "Can you recognize this form when you read it, or is this completely new?"
- Confirm the learner has no prerequisite gap. If they want to practice conditional perfect but do not know past participles, flag the prerequisite first.

### 2. Establish the Grammar Rule With Precision

Write the metalinguistic explanation -- the explicit statement of the rule -- with enough precision that the learner can use it as a decision tool.

- State the **form**: the exact morphological shape of the target structure. Use a formula with slots (e.g., `[subject] + [auxiliary HAVE in past] + [past participle]` for past perfect English).
- State the **use conditions**: the semantic or pragmatic conditions that trigger this structure. Use contrastive framing where a minimal pair makes the condition vivid (e.g., "past simple = action completed at a specific past moment known to the speaker; past perfect = action completed BEFORE another past moment").
- Provide **2-3 authentic exemplar sentences** -- not invented nonsense-content sentences. Use real-world content: news headlines, recipe steps, travel descriptions. Authentic context makes the rule memorable.
- Annotate the exemplars: underline or bracket the target form and label what the label means (e.g., `[had arrived] = past perfect, indicating earlier of two past events`).
- Include a **one-sentence heuristic** the learner can keep in working memory: "If you can say 'already' and it sounds natural, you probably need past perfect." Heuristics are not 100% accurate but reduce decision paralysis during production.
- For L1-transfer-prone errors, explicitly state the contrast: "In French, you use 'passé composé' here, but in English you need the simple past."

### 3. Design the Exercise Sequence (Four Levels)

Follow the **P-P-P progression** (Presentation -- Practice -- Production) extended into four exercise levels. Each level removes one scaffolding layer. Do not skip levels for a learner who says they are advanced -- confirm by asking them to attempt Level 1 first.

**Level 1 -- Recognition (Minimal production demand):**
- Supply 6--8 sentences. Some are grammatically correct uses of the target form; some contain errors or alternative forms.
- Ask the learner to identify: (a) which sentences use the target form correctly, (b) which contain errors, and (c) what the error is.
- Include distractor errors that reflect real L1-transfer mistakes, not random errors.

**Level 2 -- Controlled Production (Fill-in-the-blank):**
- Supply 6--8 sentence frames with the base form (infinitive or lemma) of the target verb/structure in parentheses.
- The learner produces only the target form -- no other decisions required.
- Include at least one irregular form to flag irregularity as a distinct learning challenge.
- Include one sentence that tests understanding of use condition, not just form (e.g., a sentence where the context requires choosing between two forms).

**Level 3 -- Guided Production (Sentence transformation or sentence building):**
- Supply 4--6 prompts that require the learner to construct a full sentence using the target form.
- Use structured prompts: "Write a sentence about something you had already done before you arrived at school yesterday."
- This level tests both form production AND appropriate use-condition selection.
- Learner must generate vocabulary choices, not just morphology.

**Level 4 -- Free Production (Communicative writing):**
- Supply a short communicative task (3--5 sentences minimum) that naturally elicits the target structure multiple times.
- Make the task meaningful: a journal entry, a short email, a description, a narrative. Not "write 5 sentences using X."
- Do not tell the learner how many times to use the target form -- this forces them to decide when the form is appropriate, not just insert it mechanically.

### 4. Write a Complete Answer Key With Error Diagnostics

The answer key is not optional and is not simply correct answers -- it is a diagnostic tool.

- For Level 1 and Level 2, provide the single correct answer with a one-line explanation citing the rule.
- For irregular forms, call out the irregularity explicitly: "Irregular form: 'went' (not 'goed')."
- Build a **Common Error Table** with 4--6 entries. Each entry contains:
  - The error as a learner would produce it
  - The correct form
  - The rule clause violated
  - Whether this is an L1-transfer error or an overgeneralization error (these require different remediation)
- For Level 3 and Level 4, provide a **model answer** (one fully correct version) plus a list of acceptable variations. Note what elements must be present vs. what is flexible.

### 5. Build the Self-Correction Protocol

Give the learner a procedure for what to do AFTER completing exercises -- this is where durable learning happens.

- Step 1: Score Level 1 and 2 against the answer key. Record errors by type (form error vs. use-condition error).
- Step 2: For every form error, write the correct form **three times** in a full sentence -- not in isolation. Isolated repetition does not build sentence-level memory.
- Step 3: For every use-condition error, re-read the rule statement and write one new sentence that demonstrates correct use-condition judgment.
- Step 4: Compare Level 3 and 4 free writing against the model answer. Identify two things: (a) any form error, (b) any sentence where the target structure should have appeared but did not (avoidance).
- Step 5: Set a spaced-repetition review schedule. For new grammar points: review at 1 day, 3 days, 7 days, and 21 days. Use a flashcard system or return to this skill with the same grammar point.

### 6. Provide Contextualization in the Language System

Grammar points do not exist in isolation -- connect this point to the broader grammar network.

- Name 1--2 grammar points that are **prerequisites** to this one (what the learner must already know).
- Name 1--2 grammar points that are **commonly confused** with this one (contrastive pairs: past simple vs. past perfect; ser vs. estar; wa vs. ga).
- Name 1--2 grammar points that this one **leads toward** (what the learner should study next after mastering this).
- Suggest one authentic resource type where this structure appears frequently (news articles for past tense narratives; instruction manuals for imperative; academic papers for passive voice). Learners should seek exposure, not just exercises.

### 7. Offer a Diagnostic Prompt for the Next Session

Close with a single diagnostic sentence the learner can produce at the start of the next session to confirm retention before moving on.

- The sentence should require: (a) correct form production, and (b) correct use-condition judgment.
- Example for past perfect: "Write one sentence describing something you had already finished before a specific event yesterday."
- If the learner can produce this correctly at the next session start, they are ready to progress. If not, repeat Level 2 and 3 exercises before moving on.

---

## Output Format

```
## Grammar Practice: [Exact Grammar Point Name]

**Language:** [Target language, e.g., Spanish]
**Grammar Point:** [Specific, scoped label, e.g., "Preterite vs. Imperfect contrast"]
**CEFR Level:** [A1 / A2 / B1 / B2 / C1 / C2]
**Learner L1:** [First language, e.g., English]
**Session Goal:** [Receptive only / Controlled production / Free production]

---

### The Rule

**Form:**
[Formula showing morphological structure]
[e.g., Subject + HAD + past participle (eaten, gone, finished)]

**Use Conditions:**
- Use [structure] when: [condition 1]
- Use [structure] when: [condition 2]
- Do NOT use [structure] when: [contrasting condition]

**Quick Heuristic:**
> [One-sentence decision rule the learner can hold in working memory]

**Annotated Examples:**

1. [Full sentence] -- [label and explanation]
   "By the time the train arrived, she [had already bought] her ticket."
   → [had already bought] = past perfect; ticket purchase completed before train arrival

2. [Full sentence with annotation]

3. [Full sentence with annotation]

**L1 Transfer Note (if applicable):**
[How L1 differs from target language on this point]

---

### Exercise 1: Recognition

**Instructions:** Read each sentence. Mark it C (correct use of [target form]), E (error in form), or W (wrong form chosen -- incorrect use condition). For E and W, explain the problem.

1. [Sentence]
2. [Sentence]
3. [Sentence]
4. [Sentence]
5. [Sentence]
6. [Sentence]

---

### Exercise 2: Controlled Production

**Instructions:** Complete each sentence using the correct form of the verb in parentheses. Apply the rule you just studied.

1. When we got home, the cat ___ (eat) all its food.
2. [Sentence]
3. [Sentence]
4. [Sentence]
5. [Sentence]
6. [Sentence]

---

### Exercise 3: Guided Production

**Instructions:** Write a complete sentence (your own words) that fits each prompt. Use [target grammar structure].

1. [Prompt describing a communicative situation]
2. [Prompt]
3. [Prompt]
4. [Prompt]

---

### Exercise 4: Free Production

**Task:** [A short, realistic communicative task -- 3--5 sentences]
[e.g., "Write a short paragraph (4--6 sentences) describing what had already happened in your city before you woke up this morning. You are writing for a friend who slept in."]

---

### Answer Key

**Exercise 1:**
| # | Answer | Explanation |
|---|--------|-------------|
| 1 | C / E / W | [Specific reason citing the rule] |
| 2 | | |
...

**Exercise 2:**
| # | Correct Form | Note |
|---|-------------|------|
| 1 | had eaten | Regular past participle; irregular: "eat → eaten" |
| 2 | | |
...

**Exercise 3 -- Model Answers:**
[One model answer per prompt, with a note on acceptable variations]

**Exercise 4 -- Model Paragraph:**
[Complete model paragraph using the target structure appropriately]
Acceptable variation: [What can be different and why]

---

### Common Error Table

| Learner Error | Correct Form | Rule Violated | Error Type |
|---------------|--------------|---------------|-----------|
| "I had went to the store" | "I had gone to the store" | Irregular past participle | Overgeneralization |
| [Error] | [Correction] | [Rule] | L1-transfer / Overgeneralization / Use-condition error |
| [Error] | | | |
| [Error] | | | |

---

### Self-Correction Protocol

After completing all exercises:

1. **Score Exercises 1 and 2.** Count errors. If 3+ errors: re-read the rule section before continuing.
2. **For each form error:** Write the correct sentence three times in full.
3. **For each use-condition error:** Re-read the "Use Conditions" box and write one new correct sentence.
4. **For Exercises 3 and 4:** Compare against model answers. Note any sentence where you avoided the target structure.
5. **Spaced review schedule:** Return to this grammar point at:
   - 1 day from today
   - 3 days from today
   - 7 days from today
   - 21 days from today

---

### Grammar System Connections

| Relationship | Grammar Point | Notes |
|-------------|---------------|-------|
| Prerequisite | [Structure to know first] | [Why it's needed] |
| Commonly confused with | [Contrasting structure] | [How to distinguish them] |
| Next step | [Structure to learn after] | [How this one leads to it] |

**Where to find this structure in authentic input:**
[Content type and why it features this structure frequently]

---

### Diagnostic Sentence for Next Session

**At the start of your next study session, produce this sentence without looking at today's notes:**
> [One sentence prompt requiring both correct form and correct use-condition judgment]

If you produce it correctly, you are ready to move on. If not, redo Exercise 2 and Exercise 3 before progressing.
```

---

## Rules

1. **One grammar point per session, always.** Never combine two structures in a single lesson -- not "past simple AND past perfect," not "ser AND estar." Learners who try to acquire two contrastive structures simultaneously confuse them at the production stage. Split into two sessions and sequence them.

2. **Always anchor to CEFR level.** The vocabulary of explanation, the complexity of exemplar sentences, and the cognitive demand of free-production tasks must match the learner's level. Using C1 metalanguage ("nominalization," "anaphoric reference") with a B1 learner adds a second learning challenge on top of the grammar target.

3. **Never invent nonsense exemplar sentences.** Sentences like "The elephant had eaten the purple bicycle" have no communicative value and do not help learners internalize the pragmatic contexts that trigger the structure. Use real-world scenarios: news, personal anecdotes, professional communication, travel.

4. **Always name the L1 and address transfer errors.** Transfer from L1 is the single most predictable error source. A grammar lesson that ignores the learner's L1 is leaving its most useful diagnostic tool unused. If the learner's L1 is unknown, ask.

5. **The answer key must explain, not just supply.** An answer key that says "had eaten" without saying why "had eaten" and not "ate" is only half useful. Every answer for Level 1 and Level 2 must include a one-line justification citing the specific part of the rule.

6. **Distinguish form errors from use-condition errors.** These are different problems requiring different remediation. A form error ("I had went") is a morphology problem -- drill the paradigm. A use-condition error (using past perfect when past simple is needed) is a semantic/pragmatic problem -- re-examine the use conditions and contrastive examples.

7. **Do not skip Exercise 1 (recognition) because the learner says they already know the rule.** Learners overestimate receptive competence. Recognition exercises reveal whether they have genuinely internalized the use conditions or are pattern-matching on surface cues. If the learner completes Exercise 1 with zero errors, note it and proceed to Exercise 2.

8. **The free-production task (Exercise 4) must not instruct the learner how many times to use the target form.** Explicit counting instructions ("Use the past perfect five times") turn communicative writing into a mechanical insertion task and prevent the learner from developing judgment about when the structure is appropriate.

9. **Always include the spaced-repetition schedule.** Grammar learning is not complete at the end of one session. Without explicit review timing, learners abandon newly acquired rules within 48 hours. The 1-3-7-21 schedule is grounded in spacing effect research -- do not omit it.

10. **If the learner's proficiency level is significantly mismatched with the requested grammar point (e.g., an A2 learner requesting C1 subjunctive instruction), flag the mismatch explicitly.** Provide the lesson at the learner's actual level using a bridging structure (the prerequisite that must come first), and explain what needs to be in place before attempting the requested point.

---

## Edge Cases

### The Learner Does Not Know Their CEFR Level

Ask two quick questions that substitute for formal assessment: (1) "Can you write a paragraph about your last vacation in the target language?" -- this gives a rough fluency gauge. (2) "Which of these sentences sounds wrong to you, and why?" -- supply one correct and one incorrect use of the target structure. Their response reveals metalinguistic awareness. Use these responses to calibrate CEFR band. If still uncertain, default to providing the lesson at B1 level -- the most common learner profile -- and adjust after seeing how they perform on Exercise 1.

### The Requested Grammar Point Is Language-Specific With No L1 Equivalent

Some structures have no parallel in the learner's L1 (e.g., aspect systems for English speakers learning Russian; evidentiality markers for European language speakers learning Quechua; classifiers for speakers of non-classifier languages). For these cases, do NOT attempt an analogy to L1 structure -- misleading analogies create persistent false models. Instead: (1) name the function directly ("This form marks that you personally witnessed the event, which English does not grammaticalize"); (2) focus Exercise 1 entirely on distinguishing the target form from its nearest functional neighbor in the target language; (3) expect higher error rates through Exercises 2 and 3 and adjust the self-correction protocol to include an additional "noticing" step before production.

### The Learner Has a Fossilized Error on This Grammar Point

Fossilized errors -- errors the learner produces consistently and confidently despite prior instruction -- require a different approach than first-time instruction. Indicators: the learner says "I've studied this before but I keep making the same mistake." For fossilized errors: (1) do NOT re-present the rule in the same format used in prior instruction (the learner has already stored an incorrect version of that rule); (2) use a metalinguistic contrast approach -- show the learner their incorrect form next to the correct form and ask THEM to articulate the difference; (3) weight Exercises 3 and 4 more heavily than 1 and 2, since the learner's productive automatization is what is entrenched; (4) increase spaced review to 1-2-4-7-14-21 days, since re-learning against a fossilized form takes longer than initial acquisition.

### The Learner Is Multilingual With Multiple L1/L2 Influences

When a learner's background includes 2+ prior languages, transfer can come from any of them -- and L2-to-L3 transfer often dominates over L1-to-L3 transfer (particularly if the L2 is typologically closer to the L3). Ask: "Which other languages do you speak, and which one feels most similar to [target language]?" Adjust the L1 Transfer Note section to account for the most likely transfer source, not automatically the biological L1.

### The Grammar Point Has Regional or Register Variation

Some structures are grammatically correct in one variety of a language but stigmatized in another (e.g., "gotten" in American English vs. British English; "vosotros" in Castilian Spanish vs. Latin American Spanish; the use of "vous" vs. "tu" as default in different French-speaking communities). When this arises: (1) acknowledge the variation explicitly in the Rule section; (2) ask the learner which variety they are targeting; (3) mark exercises and answers according to the target variety; (4) note in the Common Error Table which errors are errors vs. which are simply non-target-variety forms.

### The Learner Completes All Four Exercises With Zero Errors

This outcome means either (a) the grammar point was below the learner's current level, or (b) the learner has receptive and controlled competence but not yet automatic free production. Do not assume mastery. Respond by: (1) confirming with one unscaffolded, spontaneous production task -- ask them to write a 5-sentence paragraph on an unfamiliar topic that will naturally require the structure; (2) if that is also error-free, confirm the grammar point is acquired and redirect to the "Next Step" grammar point in the Grammar System Connections table; (3) if errors appear in the unscaffolded task, the learner has controlled but not automatic competence -- prescribe Exercise 4 variants with novel topics over the next 7 days.

### The Learner Wants to Practice Grammar in a Specific Skill Context (Writing, Speaking)

Sometimes a learner frames the request as "I want to practice [grammar point] in my speaking" or "for my academic writing." The grammar lesson structure remains the same, but the communicative task in Exercise 4 must match the modality and register. For speaking contexts: frame Exercise 4 as a spoken monologue prompt (what the learner would say aloud) with written notes allowed; note that automatization in speech requires a higher repetition threshold and suggest 30--50 productions over one week before expecting fluency. For academic writing contexts: use formal register throughout all exemplar sentences; include register errors (too colloquial) in the Common Error Table alongside pure grammar errors.

---

## Example

**Input:** "I keep confusing the Spanish preterite and imperfect. I'm a B1 English speaker. Can you give me a lesson with exercises?"

---

## Grammar Practice: Spanish Preterite vs. Imperfect

**Language:** Spanish
**Grammar Point:** Preterite (pretérito indefinido) vs. Imperfect (pretérito imperfecto) -- use-condition contrast
**CEFR Level:** B1
**Learner L1:** English
**Session Goal:** Use-condition judgment and controlled-to-guided production

---

### The Rule

**Forms:**

Preterite (completed event):
```
-AR verbs: habl-é, habl-aste, habl-ó, habl-amos, habl-asteis, habl-aron
-ER/-IR verbs: com-í, com-iste, com-ió; viv-í, viv-iste, viv-ió
Key irregulars: ser/ir → fui, fuiste, fue; tener → tuve; estar → estuve; hacer → hice
```

Imperfect (ongoing or habitual past):
```
-AR verbs: habl-aba, habl-abas, habl-aba, habl-ábamos, habl-abais, habl-aban
-ER/-IR verbs: com-ía, com-ías, com-ía; viv-ía, viv-ías, viv-ía
Key irregulars (only 3): ser → era; ir → iba; ver → veía
```

**Use Conditions:**

| Use the PRETERITE when: | Use the IMPERFECT when: |
|------------------------|------------------------|
| The action has a clear beginning or end | The action was ongoing with no fixed endpoint named |
| The action happened once or a countable number of times | The action was habitual or repeated in the past |
| The action is the main event of the narrative (the plot moved) | The action is background description (setting the scene) |
| The emotion or mental state changed at a specific moment | The emotion or mental state was an ongoing condition |

**Quick Heuristic:**
> Preterite = the event (what happened, plot movement); Imperfect = the atmosphere (what was going on, background, habit).

**Annotated Examples:**

1. "Ayer, **llegué** al café y **pedí** un cortado."
   → llegué = [preterite]: arrival is a bounded, single event -- the plot moves
   → pedí = [preterite]: ordering is a bounded, single event -- the plot moves

2. "Cuando era niño, **vivía** en Sevilla y todos los veranos **íbamos** a la playa."
   → vivía = [imperfect]: living in Sevilla was an ongoing background condition during childhood
   → íbamos = [imperfect]: going to the beach was a repeated habit, not a single trip

3. "Estaba leyendo cuando **sonó** el teléfono."
   → estaba leyendo = [imperfect progressive]: background ongoing action, the scene
   → sonó = [preterite]: the phone ringing is the event that breaks the background -- plot move

**L1 Transfer Note:**
English does not grammatically distinguish these two past concepts with different verb forms in the same systematic way. English uses "was reading" (progressive) for ongoing background, but also uses simple past ("read," "went") for both single events AND habits -- context usually clarifies. Spanish requires the morphological choice every time, so English speakers must make explicit what English leaves implicit. The imperfect translates to English as "used to [verb]" (habit) or "was [verb]-ing" (ongoing) -- if one of those English paraphrases fits your intended meaning, you need the imperfect.

---

### Exercise 1: Recognition

**Instructions:** Read each sentence. Mark it C (preterite used correctly), I (imperfect used correctly), or E (wrong tense chosen). For E, write which form should be used and why.

1. De niña, **tuve** un perro que se llamaba Canela.
2. El año pasado, María **estudió** en Buenos Aires durante seis meses.
3. Siempre **llegaba** tarde al trabajo, así que su jefe la despidió.
4. Cuando **entré** en la habitación, todos **cantaron** -- fue un momento muy raro.
5. **Era** las tres de la mañana cuando **oímos** el ruido.
6. De repente, **llovía** tanto que no podíamos ver nada.

---

### Exercise 2: Controlled Production

**Instructions:** Complete each sentence with the correct form of the verb in parentheses. Choose preterite or imperfect based on the context.

1. Cuando era pequeño, mi abuela siempre ___ (hacer) tortilla los domingos.
2. Ayer me ___ (llamar) mi amigo Carlos a las diez de la noche.
3. Nosotros ___ (vivir) en ese apartamento durante tres años antes de mudarnos.
4. El cielo ___ (estar) completamente despejado cuando ___ (salir / nosotros) de casa.
5. De repente, el niño ___ (empezar) a llorar sin ninguna razón.
6. En aquella época, todos los estudiantes ___ (llevar) uniforme al colegio.

---

### Exercise 3: Guided Production

**Instructions:** Write a complete, original sentence in Spanish that fits each prompt. Use preterite or imperfect as appropriate. You decide which is needed.

1. Describe something you used to do every summer as a child. (What was your habit?)
2. Describe what the weather was doing when something unexpected happened to you. (Background + event)
3. Write about the first time you did something -- eating a specific food, visiting a city, meeting someone. (Single completed event)
4. Describe the mood or atmosphere at a party you attended, then name one specific thing that happened. (Background + single event)

---

### Exercise 4: Free Production

**Task:** Write a short paragraph (5--7 sentences) describing a memorable day from your past. It could be a holiday, a school day you remember, or any day that stands out. Include both the background atmosphere of that day AND the specific things that happened. Do not translate from English first -- think in images and then produce Spanish.

---

### Answer Key

**Exercise 1:**

| # | Answer | Explanation |
|---|--------|-------------|
| 1 | E → tenía | Having a dog was an ongoing state during childhood -- no fixed endpoint. Use imperfect. |
| 2 | C | Six months in Buenos Aires is a bounded completed period. Preterite correct. |
| 3 | C | "Siempre llegaba" = habitual past action. Imperfect correct. |
| 4 | E → cantaban | The singing was an ongoing action happening when she entered -- it is background. "cantaron" would imply they started AND finished singing as a completed event. Use imperfect: "estaban cantando" or "cantaban." |
| 5 | C | "Era" = background time description (imperfect); "oímos" = the hearing event (preterite). Both correct. |
| 6 | E → llovió | "De repente" (suddenly) marks this as an event with a clear onset -- it entered the scene as a plot event. Preterite: "llovió tanto que..." |

**Exercise 2:**

| # | Correct Form | Note |
|---|-------------|------|
| 1 | hacía | Habitual Sunday habit -- imperfect. Irregular: hacer → hacía. |
| 2 | llamó | Single call at a specific named time (10pm). Preterite. |
| 3 | vivimos | Bounded three-year period, completed. Preterite. Note: "vivimos" = preterite 1st person plural (same form as present -- context clarifies). |
| 4 | estaba / salimos | Sky condition = ongoing background (imperfect); leaving = bounded event (preterite). |
| 5 | empezó | "De repente" triggers preterite -- sudden onset event. |
| 6 | llevaban | Habitual dress code of the era -- imperfect. |

**Exercise 3 -- Model Answers and Acceptable Variations:**

1. "De niño, pasábamos el verano en el pueblo de mis abuelos."
   Acceptable: any habitual or repeated action with imperfect. Must NOT use preterite here.

2. "Hacía mucho calor cuando se me pinchó una rueda en la carretera."
   Acceptable: any imperfect for weather/background + preterite for the event. The contrast must be present.

3. "La primera vez que comí sushi fue en Tokio, en 2018."
   Acceptable: any preterite with "primera vez" or equivalent first-time framing.

4. "La fiesta era tranquila y todo el mundo charlaba cuando, de repente, llegó Juan con su guitarra."
   Acceptable: background description in imperfect + a specific event in preterite. Both elements must appear.

**Exercise 4 -- Model Paragraph:**

"Recuerdo muy bien el día que cumplí quince años. Era una mañana de octubre y hacía frío en la calle. Mis padres todavía dormían cuando me levanté. De repente, bajé a la cocina y vi que la mesa estaba llena de regalos. Mi madre entró en ese momento y me abrazó. Pasamos el resto del día juntos en el parque -- hacía sol y los árboles tenían las hojas rojas y amarillas."

Acceptable variation: The learner may describe any past day. Required: at least two instances of imperfect (background/description) and at least two instances of preterite (events). Errors to watch: using only preterite throughout (narrating every detail as a discrete event) or using only imperfect (describing without any event occurring).

---

### Common Error Table

| Learner Error | Correct Form | Rule Violated | Error Type |
|---------------|--------------|---------------|-----------|
| "De niña tuve un perro" (meant: I had a dog throughout my childhood) | "tenía un perro" | Imperfect required for ongoing possession with no fixed endpoint | Use-condition error (L1 transfer: English uses "had" for both) |
| "Cuando entré, todos cantaron" (meant: they were in the middle of singing) | "estaban cantando" / "cantaban" | Background ongoing action requires imperfect | Use-condition error |
| "De repente llovía" | "llovió" | "De repente" marks clear event onset -- preterite required | Use-condition error |
| "Siempre llegué tarde" (meant: I was always late) | "llegaba" | Habitual past action requires imperfect; preterite implies a single event | Use-condition error (L1 transfer: English "arrived" covers both) |
| "Hicía mucho calor" | "Hacía mucho calor" | Irregular imperfect: hacer → hacía (not hicía) | Form error -- overgeneralization of imperfect -ía pattern |
| "Fuimos allí todos los veranos" (meant: as a child's habit) | "íbamos allí todos los veranos" | Habitual repetition across an open-ended period = imperfect; "fuimos" = one counted trip | Use-condition error -- "todos los veranos" does not by itself trigger imperfect; the habituality of the childhood period does |

---

### Self-Correction Protocol

After completing all four exercises:

1. **Score Exercises 1 and 2.** If you made 3 or more errors: re-read the Use Conditions table and the three annotated examples before checking Exercise 3 and 4.
2. **For each form error** (e.g., "hicía" instead of "hacía"): write the full correct sentence three times.
3. **For each use-condition error**: re-read the row in the Use Conditions table that applies, then write one new original sentence that demonstrates the correct choice.
4. **For Exercise 3 and 4**: compare against model answers. Check specifically: did you use imperfect for background and preterite for events? Did you avoid the target structure anywhere (e.g., wrote around a moment that should have been preterite)?
5. **Spaced review schedule**:
   - Tomorrow: produce the Diagnostic Sentence (below) without notes
   - In 3 days: redo Exercise 2 without looking at today's answers
   - In 7 days: write a new 5-sentence paragraph on a different past memory
   - In 21 days: return to this skill and request a new lesson on preterite vs. imperfect with emotional states (querer, saber, poder, conocer -- these verbs shift meaning between the two tenses)

---

### Grammar System Connections

| Relationship | Grammar Point | Notes |
|-------------|---------------|-------|
| Prerequisite | Regular preterite paradigm (all three conjugation classes + top 10 irregulars) | Cannot make a use-condition decision if the forms are not automatic |
| Commonly confused with | Present perfect (pretérito perfecto compuesto: he comido) | In Peninsular Spanish, recent past often uses present perfect where Latin American Spanish uses preterite -- same use-condition logic applies once the learner knows which regional standard they are targeting |
| Next step | Preterite vs. imperfect with state verbs (saber, conocer, querer, poder) | These verbs change meaning between the two tenses ("supé" = I found out; "sabía" = I knew) -- a separate lesson is required |

**Where to find this structure in authentic input:**
Short narrative journalism in Spanish (El País, La Nación, BBC Mundo) uses both tenses in every article -- the preterite drives the story forward, the imperfect provides context. Read one news article per day and highlight every past-tense verb, labeling it P (preterite) or I (imperfect). This habit builds pattern recognition faster than drills alone.

---

### Diagnostic Sentence for Next Session

**At the start of your next study session, produce this sentence in Spanish without looking at today's notes:**
> "Describe the scene in a café you walked into recently -- what was happening in the background, and what specific thing did you do once you were there?"

Your response should include at least one imperfect (the background scene) and at least one preterite (what you did). If you produce both correctly, you are ready to move to the state-verb lesson. If not, return to Exercise 2 of today's session before progressing.
