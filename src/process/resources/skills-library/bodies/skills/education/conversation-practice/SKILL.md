---
name: conversation-practice
description: |
  Creates guided conversation practice with prompts, scaffolding, and feedback for language learners using the communicative approach. Produces a structured conversation exercise the learner can practice with the AI.
  Use when a learner asks to practice conversation in a target language, do speaking exercises, practice dialogue, or improve conversational fluency.
  Do NOT use for grammar instruction (use `grammar-practice`), for vocabulary building (use `vocabulary-building`), or for translation exercises (use `translation-practice`).
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
# Conversation Practice

## When to Use

Use this skill when the learner explicitly wants to engage in interactive, real-time conversation practice with the AI acting as a conversational partner. Specific trigger scenarios include:

- A learner says "I want to practice speaking Spanish" or "Let's have a conversation in French" -- they want live, turn-by-turn dialogue with an AI partner, not a grammar lesson
- A learner asks to rehearse a specific real-world scenario: job interview in German, ordering food in Japanese, negotiating in Mandarin, small talk at a party in Italian
- A learner wants to build fluency and automaticity at a level they already have basic competence in -- they know words and rules but freeze in conversation
- A learner requests role-play, dialogue practice, or wants to "feel what it's like" to talk with a native speaker on a topic
- A learner preparing for a DELF, JLPT oral component, Cambridge Speaking test, or other proficiency exam wants timed, structured speaking practice under exam-like conditions
- A learner returning after a break from a language wants to reactivate passive knowledge through speaking rather than study
- A learner has reached a "plateau" where grammar study no longer helps and needs communicative exposure to move forward

**Do NOT use when:**
- The learner is asking WHY a grammatical rule works or asking to drill a specific structure -- use `grammar-practice` instead, which focuses on form-focused instruction and pattern drilling
- The learner wants to expand their word bank, learn new vocabulary sets, or practice flashcard-style recall -- use `vocabulary-building` instead
- The learner wants to convert text between two languages or understand translation equivalence -- use `translation-practice` instead
- The learner is a teacher or curriculum designer creating materials for students -- use an educator-facing skill that produces classroom-ready artifacts
- The learner is a complete beginner at the A0 level with fewer than 50 words of target language -- they need foundational vocabulary and pronunciation grounding before conversation practice adds value; redirect to `vocabulary-building` first
- The learner wants to improve writing in a target language -- conversation practice focuses on spoken register and turn-taking dynamics, not written composition

---

## Process

### Step 1: Assess the Learner's Profile Before Starting

Before generating any conversation content, gather exactly the information needed to calibrate the session. Ask only what you don't already know -- if the learner said "I'm a B1 Spanish learner who wants to practice talking about my job," you already have level, language, and topic.

- **Target language:** Confirm the language and any regional variety that matters (European vs. Brazilian Portuguese, Castilian vs. Latin American Spanish, Mandarin vs. Cantonese) -- regional vocabulary and register differ significantly
- **CEFR level or equivalent:** Ask the learner to self-assess using plain language if they don't know CEFR -- "Can you hold a basic conversation but struggle with fast speech?" maps to B1; "I understand almost everything but struggle with slang and idiom" maps to B2-C1. If unsure, start the session at the level they claim and recalibrate during Phase 2.
- **Conversation goal:** Identify whether this is scenario-based (preparing for a real situation), fluency-building (general practice), exam preparation, or reactivation after a break -- each calls for a different session design
- **Scaffolding preferences:** Ask if they want vocabulary hints available during the conversation or prefer to struggle and receive feedback afterward -- both are valid, and learner agency over scaffolding increases motivation
- **Time available:** A 10-minute session gets one scenario with focused feedback; a 30-minute session can run a warm-up, main scenario, free conversation, and full error analysis

### Step 2: Select Topic, Scenario, and Difficulty Calibration

Match the conversation scenario to both the learner's CEFR level and their real-world goal. Do not use generic or infantilizing topics for adult learners even at A2 level.

- Apply the CEFR communicative task descriptors: A1-A2 tasks involve transactions (buying, introducing, asking for information); B1-B2 tasks involve narration, opinion, and hypothetical reasoning; C1-C2 tasks involve abstract argumentation, irony, register flexibility, and cultural subtext
- Choose a scenario with a clear communicative goal -- "order a coffee" is too short; "have a 5-minute exchange with a café owner who asks about your day and makes a recommendation" creates enough turns for meaningful practice
- Embed realistic interactional features into the scenario: topic shifts, clarification requests, interruptions (at B2+), misunderstandings, and sociopragmatic choices (formal vs. informal register)
- For exam preparation, mirror the actual task format: DELF B2 oral production involves a 3-minute monologue followed by an 8-minute discussion -- simulate this exactly
- Decide on error correction mode before starting: **immediate recast** (you rephrase their error correctly in your next turn without breaking flow), **delayed correction** (collect errors and review after the exchange), or **negotiation of meaning** (ask "did you mean X or Y?" to prompt self-correction). Immediate recast is best for A1-B1; delayed correction is best for B2+; negotiation is best for C1+

### Step 3: Present the Conversation Setup

Before starting the dialogue, give the learner everything they need to engage -- but calibrate how much scaffolding to include based on their level.

- **State the scenario clearly:** Describe the setting, the learner's role, the AI's role, the communicative goal (what "success" looks like at the end of the exchange), and any important background context
- **Provide vocabulary support appropriate to level:**
  - A1-A2: Full phrase list with native language translation and phonetic hints if the script is non-Roman
  - B1: Key vocabulary only (8-12 words or phrases likely to come up), no translation
  - B2: Optional glossary the learner can consult if needed -- present it but don't require it
  - C1-C2: No vocabulary support; focus on register choices and discourse markers
- **Set behavioral expectations:** Tell the learner to respond in the target language only, to attempt utterances even if uncertain, and to indicate confusion with target-language phrases ("Je ne comprends pas," "¿Puede repetir?") rather than switching to English
- **Indicate correction mode so the learner knows what to expect:** "I'll note any significant errors and we'll review them after -- don't worry about perfection, just keep talking"

### Step 4: Run the Scaffolded Dialogue (Phase 1 -- Structured Exchange)

This is the core interactive phase. The AI acts as a fluent, patient conversational partner at a register appropriate to the scenario. Follow communicative language teaching (CLT) principles rigorously.

- **Open with a warm-up exchange (2-4 turns):** Start with a question the learner can almost certainly answer to build confidence and activate their linguistic working memory before the main scenario begins
- **Maintain your conversational character throughout:** If you are playing a hotel receptionist in French, do not break character to teach or explain -- stay in role and use repair strategies (asking for clarification, using simpler language) that a real interlocutor would use
- **Modulate your speech to the learner's level in real-time:**
  - A1-B1: Use shorter sentences, slower apparent pace (shorter turns), high-frequency vocabulary, clear topic sentences; avoid contractions and ellipsis that obscure meaning
  - B2: Natural speed and complexity; introduce phrasal verbs, idiomatic expressions, and topic shifts
  - C1-C2: Use colloquial speech, humor, implicit references, and register variation -- this is what learners at this level need exposure to
- **Track communicative success, not just accuracy:** Note whether the learner achieved the communicative goal (did they successfully negotiate the scenario?) separately from linguistic accuracy. A B1 learner who communicates effectively with errors is more advanced than one who produces correct but non-communicative utterances.
- **Use comprehension checks strategically:** If the learner produces an ambiguous utterance, respond as a real interlocutor would -- ask for clarification in the target language, not in English. This forces productive reformulation.
- **Keep your turns appropriately short:** At A1-B1, keep AI turns to 1-2 sentences to avoid overwhelming the learner with input they cannot process. At B2+, longer, more complex turns are appropriate because the learner needs exposure to connected discourse.

### Step 5: Run the Free Conversation Phase (Phase 2 -- Unscaffolded)

After the structured scenario, shift to a shorter free conversation on the same theme. Remove all scaffolding.

- Announce the shift: "Now let's talk more freely about this topic. I'll ask you some questions and you can ask me anything too."
- Use open-ended questions that require more than single-word responses: "What do you think about...?", "Have you ever...?", "What would you do if...?"
- Introduce one or two unexpected topic turns that the learner didn't prepare for -- this tests real communicative flexibility
- At B2+, introduce a mild disagreement or devil's advocate position to generate argumentative language ("I'm not sure I agree -- don't you think that...?")
- Continue noting significant errors but maintain full conversational flow without interruption -- this phase is about fluency, not accuracy

### Step 6: Deliver Error Analysis and Corrective Feedback

After the conversational exchange ends, shift to feedback mode. This is the most pedagogically critical step and must be done carefully.

- **Prioritize errors by communicative impact:** Address errors that caused or risked misunderstanding first (vocabulary substitutions, tense errors that change meaning). Address form-only errors (minor agreement errors in languages with complex agreement systems) second. Ignore stylistic variations that are merely non-native but not wrong.
- **Limit correction to 3-5 errors per session:** Cognitive load research in SLA (second language acquisition) consistently shows that learners cannot internalize more than a handful of corrective instances per session. Overwhelming the learner with 15 corrections causes shutdown, not improvement.
- **Use the three-part corrective feedback format for each error:**
  1. **What you said:** Quote the learner's exact utterance
  2. **Correct form:** Provide the accurate target-language version
  3. **Brief explanation:** One sentence explaining the rule or why the correction matters -- this activates metalinguistic awareness
- **End each correction with a retrieval prompt:** Ask the learner to produce the correct form in a new sentence. This immediate production practice after correction doubles retention compared to passive reception alone.
- **Explicitly praise strong utterances:** Identify 2-3 things the learner did well -- natural collocations used correctly, complex structures attempted, idiomatic expressions deployed successfully. Positive evidence accelerates acquisition just as error correction does.

### Step 7: Assign Spaced Repetition Homework and Set Next Session Goals

End every session by giving the learner specific, concrete actions that extend learning beyond this interaction.

- **Identify 3-5 target phrases or structures** from this session that the learner should practice repeatedly -- these should be phrases they needed but didn't have, or errors they made more than once
- **Assign a spaced repetition schedule:** Day 1 (same day) -- write the phrase and use it in 2 new sentences. Day 3 -- recall without looking. Day 7 -- use in a short spoken monologue. This 1-3-7 spacing aligns with optimal forgetting-curve recovery intervals for procedural language learning.
- **Suggest one real-world use opportunity:** A specific context where the learner could deploy today's language -- a phone call, an email in the target language, a conversation with a native-speaking colleague, a social media comment
- **Define the next session's goal:** Be specific -- "Next session, we'll practice the same restaurant scenario but I'll play a difficult customer so you have to handle a complaint" is better than "practice more conversation"
- **Flag grammar patterns for follow-up:** If the learner repeatedly made the same grammatical error (e.g., subjunctive avoidance in Spanish, particle placement in German), note that this pattern would benefit from a focused `grammar-practice` session before the next conversation practice

---

## Output Format

```
## Conversation Practice Session: [Target Language] -- [Topic/Scenario Name]

**Learner Level:** [CEFR level, e.g., B1]
**Target Language:** [Language and regional variety if applicable]
**Session Goal:** [Specific communicative goal for this session]
**Scenario:** [2-3 sentence description of the role-play situation]
**Error Correction Mode:** [Immediate recast / Delayed correction / Negotiation]
**Estimated Session Length:** [X minutes]

---

### Vocabulary Support (Pre-Session)

| Target Language Phrase | Meaning/Translation | Register Note |
|------------------------|---------------------|---------------|
| [Phrase 1]             | [Meaning]           | [Formal/Informal/Neutral] |
| [Phrase 2]             | [Meaning]           | [Register]    |
| [Phrase 3]             | [Meaning]           | [Register]    |
[Continue for 6-12 items at A1-B1; omit or make optional at B2+]

---

### Phase 1: Warm-Up (2-3 turns)

*AI opens with an easy, confidence-building question in the target language.*

AI: [Opening warm-up line in target language]

[Continue turn by turn, alternating AI and learner prompts]

---

### Phase 2: Structured Scenario ([X] turns)

*The main role-play scenario begins. Your role is [Learner's character]. My role is [AI character].*
*Your goal: [Specific communicative outcome -- e.g., "successfully book a room for two nights"]*

AI: [First line of scenario in target language]

[Continue the scaffolded dialogue with suggested response patterns at A1-B1;
omit response patterns at B2+]

---

### Phase 3: Free Conversation ([X] turns)

*Scaffolding removed. Respond naturally. I'll ask questions and you can ask me anything too.*

AI: [First free-conversation question in target language]

---

### Error Analysis

**Errors Corrected This Session:** [X of 3-5 prioritized]

| # | What You Said | Correct Form | Rule / Explanation |
|---|--------------|--------------|-------------------|
| 1 | [Exact learner utterance] | [Corrected version] | [One-sentence explanation] |
| 2 | [Exact learner utterance] | [Corrected version] | [One-sentence explanation] |
| 3 | [Exact learner utterance] | [Corrected version] | [One-sentence explanation] |

**Retrieval Practice -- Try these now:**
1. Use [corrected form] in a new sentence about a different topic.
2. [Second retrieval prompt]

---

### What You Did Well

- [Specific praise for a natural collocation, successful idiom, or complex structure]
- [Second specific praise point]
- [Third specific praise point]

---

### Session Homework (Spaced Repetition)

**Target Phrases for This Week:**
1. [Phrase 1] -- [Brief context note]
2. [Phrase 2] -- [Brief context note]
3. [Phrase 3] -- [Brief context note]

**Practice Schedule:**
- **Today:** Write each phrase in 2 new sentences of your own
- **Day 3:** Cover the target language and recall from memory
- **Day 7:** Use all three phrases in a 2-minute spoken monologue about [related topic]

**Real-World Use Opportunity:**
[Specific, concrete suggestion for using today's language in a real context this week]

---

### Next Session Recommendation

**Suggested Scenario:** [More challenging version of today's scenario, or a new scenario that builds on today's vocabulary and structures]
**Grammar Focus to Address First (if applicable):** [Specific pattern -- link to grammar-practice skill if repeated error observed]
**Level Progression Note:** [Whether the learner is ready to advance, consolidate, or needs more practice at this level]
```

---

## Rules

1. **NEVER conduct conversation practice in English when the learner's goal is another language.** All AI turns in the dialogue phases must be in the target language. The only acceptable English (or metalanguage) is in instructions, error analysis explanations, and vocabulary support at A1-A2 level. Breaking into English during dialogue destroys the immersive communicative context the skill depends on.

2. **Limit error correction to 3-5 items per session, always.** More than 5 corrections per session causes cognitive overload and discourages the risk-taking that conversation practice requires. Prioritize errors by communicative impact: errors that caused genuine misunderstanding come first; minor morphological errors that didn't impede communication can be omitted entirely.

3. **Do not interrupt the conversational flow to correct errors in real-time at B1 and above.** Immediate interruption destroys fluency development. Use recasts at A1-B1 (model the correct form naturally in your response), and switch to delayed correction at B2+. The learner must experience the sensation of sustained communication to develop automaticity.

4. **Calibrate your language complexity to the learner's CEFR level in every AI turn.** At A1, limit vocabulary to the 1,000 most common words in the target language, use simple present and simple past tenses only, and keep sentences under 10 words. At C1, use idiomatic expressions, discourse markers, implicit cultural references, and register variation freely.

5. **Never allow the scenario to become vocabulary-focused mid-session.** If the learner asks "how do you say X?" during the dialogue phase, answer briefly in the target language and return immediately to the scenario. Sustained vocabulary building belongs in `vocabulary-building`, not here. One brief definition or synonym is acceptable; turning the session into a vocabulary lesson is not.

6. **Always end with a concrete next session goal.** Vague encouragement ("keep practicing!") does not build a learning trajectory. Specify the next scenario, the target structures to consolidate, and whether the learner is ready to advance to the next CEFR level. Learners typically need 50-80 hours of communicative practice to advance one full CEFR level -- calibrate expectations accordingly.

7. **Match the register of the scenario.** A formal business negotiation in Japanese requires keigo (polite/formal forms). A casual conversation between friends in French requires tu-form and informal contractions. Practicing formal language for informal scenarios, or vice versa, creates pragmatic competence gaps that are harder to correct than grammatical errors.

8. **Give positive evidence alongside corrective feedback in every session.** Identify at least 2 things the learner did well -- specific phrases, structures, or communicative strategies. Learners who receive only corrections develop anxiety-driven monitoring that suppresses the automaticity needed for fluent conversation. Positive evidence is not empty praise; it is specific and linguistic ("Your use of 'sin embargo' there was exactly right and sounded natural").

9. **If the learner consistently switches to English mid-conversation, treat this as a sign of level mismatch, not laziness.** Frequent code-switching is a signal that the task is above the learner's current productive capacity. Immediately lower the complexity of your next turn, offer more scaffolding, and note in the session summary that this topic may need more vocabulary groundwork first.

10. **For non-Latin scripts (Arabic, Chinese, Japanese, Korean, Russian, Hindi, etc.), always include romanization/transliteration alongside target-language text at A1-B1 level.** Learners at this level cannot process meaning and decode an unfamiliar script simultaneously. At B2+, romanization should be phased out unless the learner specifically requests it, because dependence on romanization prevents script automaticity.

---

## Edge Cases

### The Learner Freezes or Goes Silent During the Dialogue
This is the most common challenge in AI conversation practice and must be handled without breaking the target-language immersion unnecessarily. First, offer a prompt in the target language that narrows the expected response: if you asked an open question and they froze, ask a yes/no version of the same question. If they still cannot respond, offer a sentence starter in the target language: "You could start with..." followed by 2-3 words. Only if they explicitly ask for English help should you briefly step out of character, and you should re-enter the target language immediately after. Note the vocabulary gap for the error analysis phase -- freezing is usually a retrieval failure, not a grammar problem.

### The Learner's Level Self-Assessment Is Significantly Inaccurate
Learners frequently overestimate (claiming B2 but producing A2-level output) or underestimate (claiming A2 but handling B1 tasks comfortably) their level. Recalibrate within the first 4-5 turns based on evidence: sentence complexity, tense range, vocabulary diversity, and ability to handle unexpected topic shifts. If recalibrating downward, do so gradually -- introduce simpler vocabulary in your next turn and slow your turn complexity rather than announcing the level adjustment, which can be discouraging. If recalibrating upward, increase complexity and reduce scaffolding incrementally and note the adjustment at the end of the session.

### The Learner Is Preparing for a Specific High-Stakes Situation Within 48 Hours
A learner saying "I have a job interview in French on Thursday" needs scenario-specific rehearsal, not general fluency work. In this case, prioritize exact scenario fidelity over CEFR progression: identify the 10-15 most likely questions in that specific context, drill the learner's responses to those questions, identify 3-4 phrases that will signal fluency and competence to a native-speaking interviewer (discourse markers, hedging language, professional register), and run a full timed mock session. The error analysis should focus only on errors that would make the learner sound unprofessional to a native speaker, not minor morphological issues that would not affect the interview outcome.

### The Learner Uses Their Native Language for Emotional or Complex Content
When learners hit emotionally resonant or cognitively complex content (describing a difficult personal experience, making a complex argument), they often revert to their L1 because the cognitive and emotional load of the content competes with the linguistic load of production. Do not treat this as a failure. Acknowledge the content briefly in English, then model how to express a simplified version of the same idea in the target language. Say explicitly: "Here is one way to express that in [target language] at your current level -- it won't capture everything you said in English, but it's a real start." This validates the learner's communicative intent while giving them a productive reformulation.

### The Learner Wants to Practice a Very Low-Frequency or Specialized Register
A learner wanting to practice medical Spanish, legal German, diplomatic French, or technical Japanese is requesting content that requires domain-specific vocabulary above and beyond standard CLT materials. In these cases, build the vocabulary support section with 15-20 domain-specific terms before the dialogue begins, even at B2+ level where scaffolding is normally minimal. Run the scenario with explicit acknowledgment that the learner may need to ask for repetition or clarification frequently -- this is realistic and appropriate for domain-specific communication even for advanced speakers. Recommend that after this session, the learner do a dedicated vocabulary-building session focused on the domain before the next conversation practice.

### The Target Language Has Significant Politeness or Formality Systems That Are Non-Obvious
Japanese (keigo), Korean (speech levels), Javanese (ngoko/krama), Thai (polite particles), and to a lesser extent French (tu/vous), German (du/Sie), and Spanish (tú/usted/vos) all have formality systems where using the wrong register causes genuine social offense or communicative failure -- not just awkwardness. Before beginning any scenario in these languages, explicitly identify the appropriate register for the scenario (a conversation with a store clerk requires different forms than a conversation with a CEO) and note any key politeness markers the learner should use. At the end of the session, include a register check in the error analysis: not just grammatical accuracy, but whether the learner's register choices were appropriate throughout.

### The Learner Wants to Practice With a Specific Dialect or Accent Variation They Will Encounter
A learner preparing to live in Québec needs exposure to joual expressions and Québécois features (tu as → t'as, je ne → j'pas) that standard Parisian French practice will not prepare them for. A learner moving to Buenos Aires needs Rioplatense voseo (vos querés, not tú quieres). In these cases, conduct the entire AI side of the conversation in the target regional variety, explicitly flag non-standard features when they appear with a brief note ("This is typical Québécois -- standard French would be..."), and build the vocabulary support section with dialect-specific terms. Note, however, that learners should have standard variety competence before adding dialect variation -- if the learner is below B1, redirect to standard variety practice first.

### The Learner Has Already Done Multiple Sessions on the Same Topic Without Progress
If a learner reports they have practiced the same scenario many times but still struggle, the problem is almost certainly not a lack of conversation practice -- it is a specific underlying gap in grammar, vocabulary, or phonology that conversation practice cannot fix. Diagnose the specific bottleneck by asking them to produce 5 sentences on the topic and analyzing the pattern of errors. If errors cluster around a specific structure (e.g., all errors involve subjunctive, or all errors involve particle use), redirect immediately to `grammar-practice` for that structure. Return to conversation practice only after the target structure has been addressed. Continuing conversation practice when a learner has a fixable structural gap produces fossilization -- the error becomes permanently embedded in their productive system.

---

## Example

**Input:** "I'm a B1 Spanish learner. I'm traveling to Madrid next month and I want to practice checking into a hotel and asking about nearby things to do. I've never really done conversation practice before so I'd like some help."

---

## Conversation Practice Session: Spanish -- Hotel Check-In and Local Recommendations

**Learner Level:** B1
**Target Language:** Spanish (Castilian -- appropriate for Madrid)
**Session Goal:** Successfully check into a hotel, handle a minor room issue, and ask for local recommendations
**Scenario:** You are arriving at a mid-range hotel in Madrid after a long flight. You have a reservation. I am the front desk receptionist. You need to check in, you discover your room faces a noisy street, and you want to ask what's good to do nearby this evening.
**Error Correction Mode:** Delayed correction (errors noted and reviewed after the exchange)
**Estimated Session Length:** 20 minutes

---

### Vocabulary Support (Pre-Session)

Review these before we start. Try to use them naturally during the conversation.

| Spanish Phrase | Meaning | Register Note |
|----------------|---------|---------------|
| Tengo una reserva a nombre de... | I have a reservation under the name of... | Neutral -- standard check-in phrase |
| ¿Me podría cambiar de habitación? | Could you change my room? | Polite -- use this, not the blunt "cambia mi habitación" |
| La habitación da a la calle | The room faces the street | Neutral -- useful for explaining the problem |
| Hace bastante ruido | It's quite noisy | Neutral |
| ¿Qué recomienda por aquí? | What do you recommend around here? | Informal-neutral -- perfect for this context |
| A unos minutos a pie | A few minutes on foot | Common local expression -- very natural in Spain |
| Me lo apunto | I'll make a note of that / I'll remember that | Informal -- sounds very natural and native |
| ¿Hasta qué hora abre? | Until what time is it open? | Neutral -- essential for checking hours |
| Está de maravilla | It's wonderful / It's fantastic | Informal -- commonly heard in Madrid |
| ¿Tiene algo más tranquilo? | Do you have something quieter? | Polite -- useful alternative to the room-change request |

---

### Phase 1: Warm-Up (3 turns)

*Let's start easy before the main scenario. Respond in Spanish.*

**AI:** ¡Buenas tardes! ¿Qué tal el viaje desde casa?
*(Good afternoon! How was the trip from home?)*

[Learner responds]

**AI:** Ah, ¡qué bien! Los vuelos a Madrid suelen ser cómodos. ¿Es la primera vez que visitas la ciudad?
*(Ah, great! Flights to Madrid are usually comfortable. Is this your first time visiting the city?)*

[Learner responds]

**AI:** Perfecto. Pues bienvenido/a. Madrid tiene mucho que ofrecer.
*(Perfect. Well, welcome. Madrid has a lot to offer.)*

---

### Phase 2: Structured Scenario (12-15 turns)

*The main role-play begins now. You are arriving at the hotel. Come to the front desk.*

**AI (as receptionist):** Buenas tardes, ¿en qué le puedo ayudar?
*(Good afternoon, how can I help you?)*

[Learner checks in -- try to use "Tengo una reserva a nombre de..."]

**AI:** Perfecto, sí, aquí lo tengo. ¿Me puede confirmar su nombre completo y el número de noches?

[Learner confirms details]

**AI:** Estupendo. Le doy la habitación 412, en el cuarto piso. Da a la calle Mayor, que es muy animada.

[Learner reacts -- this is the moment to raise the noise issue. Try "¿Tiene algo más tranquilo?" or "¿Me podría cambiar de habitación?"]

**AI:** Entiendo, sí, la calle Mayor puede ser ruidosa por las noches. Déjeme ver... Sí, tengo la habitación 508, que da al patio interior. ¿Le parece bien?

[Learner accepts]

**AI:** Perfecto. Aquí tiene su llave. El desayuno está incluido, de ocho a diez de la mañana. ¿Necesita algo más?

[Learner asks for local recommendations -- try "¿Qué recomienda por aquí?"]

**AI:** ¡Ah, por supuesto! Pues, si le gusta el arte, el Museo del Prado está a unos veinte minutos a pie. Y si quiere cenar algo típico esta noche, le recomiendo el Mercado de San Miguel, que está muy cerca de aquí, a cinco minutos.

[Learner asks a follow-up question -- try asking about opening hours or what kind of food is at the Mercado]

**AI:** El mercado cierra a las doce de la noche los viernes, así que tiene tiempo de sobra. Hay de todo: jamón, queso, tapas, vino... es muy popular entre los turistas y también entre los madrileños.

[Learner wraps up the interaction]

**AI:** De nada, que disfrute de Madrid. ¡Cualquier cosa, aquí estamos!

---

### Phase 3: Free Conversation (5-6 turns)

*Great work on the scenario. Now let's talk more freely. No vocabulary list -- just talk. I'll ask you some questions and you can ask me anything too.*

**AI:** ¿Ya tienes planes para mañana en Madrid, o todavía no has decidido qué hacer?

[Learner responds]

**AI:** Interesante. ¿Y has probado la comida española antes? ¿Hay algo que te apetezca probar especialmente?

[Learner responds]

**AI:** A mí me parece que el cocido madrileño es imprescindible si visitas Madrid en invierno, aunque es un plato bastante contundente. ¿Eres de los que prefieren la comida ligera o no te importa comer bien?

[Learner responds and can ask the AI a question if they want]

**AI:** [Responds naturally to learner's question, keeps free conversation going for 1-2 more turns]

---

### Error Analysis

*End of conversation. Here are the most important things to review from your session.*

**Errors Corrected This Session:** 3 (prioritized by communicative impact)

| # | What You Said | Correct Form | Rule / Explanation |
|---|--------------|--------------|-------------------|
| 1 | "Quiero cambiar la habitación" | "¿Me podría cambiar de habitación?" or "¿Tiene algo más tranquilo?" | Direct imperatives and bare infinitives (quiero + infinitive) sound abrupt in Spanish service contexts. Use conditional courtesy forms (podría, tendría) for requests to strangers -- this is a register issue, not a grammar error, but it matters significantly in Spain. |
| 2 | "El museo es abierto?" | "¿El museo está abierto?" or "¿A qué hora abre el museo?" | Ser vs. estar: conditions and states that can change (open/closed, available/unavailable) use estar, not ser. "Es abierto" sounds like a permanent characteristic, which is unnatural here. |
| 3 | "Desde cuándo cierra?" | "¿Hasta qué hora cierra?" or "¿A qué hora cierra?" | Desde (since/from) is used for the beginning of a time period; hasta (until) is for the end. "¿Desde cuándo cierra?" asks when it started being closed, not what time it closes tonight. |

**Retrieval Practice -- Try these now:**
1. Ask me what time a restaurant closes, using the correct preposition.
2. Make a polite request asking if the hotel has a pool -- use the conditional form.

---

### What You Did Well

- Your use of "Tengo una reserva a nombre de..." was natural and immediate -- that's exactly the phrase a fluent speaker would use and you deployed it without hesitation.
- You used "da a la calle" correctly and naturally when explaining the noise problem -- this is a collocation that non-native speakers often struggle with, and you got it right.
- Your free conversation responses used full sentences with connected ideas, not just single-word answers. Your use of "aunque" (although) to express a contrasting idea showed good sentence complexity for B1.

---

### Session Homework (Spaced Repetition)

**Target Phrases for This Week:**

1. **¿Me podría...?** -- Your go-to structure for polite requests in any service situation (hotel, restaurant, shop). Replace "quiero" requests with this form whenever you're speaking to a stranger.
2. **Está abierto / está cerrado** -- Practice this estar distinction by describing 5 places near your home using the correct form each day until it becomes automatic.
3. **¿Hasta qué hora...?** -- Use this whenever you need to ask about closing times, deadlines, or end-of-period information. It will come up constantly in travel contexts.

**Practice Schedule:**
- **Today:** Write each of the three phrases in 3 new sentences about a different travel scenario (train station, restaurant, museum)
- **Day 3:** Cover the Spanish and try to recall each phrase from only the English meaning
- **Day 7:** Do a 2-minute spoken monologue in Spanish describing what you'd do on your first evening in Madrid, using all three phrases naturally

**Real-World Use Opportunity:**
Find a Spanish-language hotel or restaurant website (search for any parador.es property or a Madrid restaurant on a Spanish booking site) and read their FAQ page in Spanish. Find one sentence that uses estar + open/closed and one sentence with hasta -- this visual confirmation reinforces the patterns we worked on today.

---

### Next Session Recommendation

**Suggested Scenario:** Restaurant dinner -- making a reservation, ordering food with dietary requirements, dealing with a wrong order, and paying the bill. This builds on today's polite request structures and service-context register, and adds food vocabulary you'll need immediately in Madrid.

**Grammar Focus to Address First:** Your ser/estar distinction (error #2 above) came up once today but is likely to surface more in daily conversation. A focused `grammar-practice` session on ser vs. estar with states and conditions would consolidate this before the next conversation practice -- it will take approximately 20 minutes and will prevent this error from fossilizing.

**Level Progression Note:** Your comprehension and communicative success today were solidly B1. You handled unexpected topic shifts in Phase 3 well. After 2-3 more sessions at this level of complexity, you'll be showing B2 indicators -- particularly if you work on hedging language ("creo que," "me parece que," "supongo que") which will make your free conversation sound more natural at the next level.
