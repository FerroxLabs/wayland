---
name: exam-practice
description: |
  Creates deliberate practice exam sessions with timed questions, scoring, error analysis, and targeted review for students preparing for specific exams. Uses Socratic follow-up on errors rather than simply providing correct answers.
  Use when a student asks to practice for an exam, do timed practice questions, simulate test conditions, or review mistakes from practice tests.
  Do NOT use for exam strategy planning (use `exam-prep-plan`), for flashcard review (use `spaced-repetition`), or for creating the actual exam (use `assessment-design`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "tutoring active-recall study-skills step-by-step"
  category: "education"
  subcategory: "tutoring"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Exam Practice

## When to Use

Use this skill when a student needs to simulate exam conditions, drill practice questions with real feedback, and build the retrieval and reasoning fluency required to perform on test day.

**Trigger scenarios:**
- A student says "quiz me on," "give me practice questions," "let's do a mock exam," or "I want to practice for [specific exam]"
- A student has a real exam within hours, days, or weeks and needs focused drilling rather than re-reading notes
- A student has just completed a practice test and wants to review errors -- especially when they can identify the wrong answers but not why they were wrong
- A student needs timed question practice to build exam-pace fluency (e.g., ACT math pacing, bar exam essay timing, CPA multiple-choice speed)
- A student can recall definitions from flashcards but fails to apply concepts under realistic question formats
- A student wants to isolate a specific weak topic (e.g., "I keep missing stoichiometry questions" or "I always misread probability problems")
- A student has finished a content-review phase and is ready to shift from recognition-based study to retrieval-based practice

**Do NOT use when:**
- The student needs an overall exam preparation roadmap with schedule and resource allocation -- use `exam-prep-plan` instead
- The student wants to drill isolated facts, vocabulary, or definitions with spaced repetition -- use `spaced-repetition` instead
- An educator or instructor needs to design a formal assessment, rubric, or question bank for a class -- use `assessment-design` instead
- The student is confused about fundamental concepts and hasn't yet studied the material; drilling before building schema reinforces misconceptions -- redirect to concept-explanation first, then return here
- The student needs writing or essay coaching for exam essays (e.g., AP Literature, law school essays) -- use `writing-feedback` or `argumentative-writing` instead
- The student needs exam registration logistics, accommodations questions, or administrative exam advice -- this skill covers only academic practice content

---

## Process

### Step 1: Intake -- Establish Session Parameters

Before generating a single question, collect the four pieces of information that determine everything else: what exam, what content, how much time, and what the student already knows.

- Ask: "Which specific exam are you preparing for?" -- The answer radically changes question format (MCQ, free-response, case-based, essay), timing, and scoring rubric. SAT math questions behave differently from AP Chemistry FRQs, which behave differently from USMLE Step 1 clinical vignettes.
- Ask: "What topics or sections do you want to focus on today?" -- If the student says "everything," default to a diagnostic sampling across major domains rather than exhaustive coverage of one topic.
- Ask: "How much time do you have right now?" -- Map their available time to the session phases: a 20-minute session gets Phase 1 (timed questions) only; a 45-minute session includes Phase 2 (error analysis); a 60+ minute session includes all four phases.
- Ask: "Have you taken any practice tests on this material before? If yes, what were your weak areas?" -- Prior diagnostic data lets you weight questions toward demonstrated weaknesses rather than a naive random distribution.
- If the student cannot answer the exam name specifically (e.g., "just a biology test next week"), ask for the course level, topic list, and question format their teacher uses.
- Do NOT generate questions until you have at minimum: the subject domain, approximate difficulty level, and preferred question format.

---

### Step 2: Configure Session Mode

Choose one of three modes based on the student's needs, then set explicit parameters before the session begins.

**Mode A -- Diagnostic (use when the student has no prior data on weak areas):**
- Generate 15--25 questions sampling broadly across the major domains of the exam
- Do not time individual questions; instead, set a total time cap (e.g., 30 minutes for 20 questions)
- Weight question difficulty at approximately 40% easy, 40% medium, 20% hard
- Goal: surface which topic clusters need the most work

**Mode B -- Targeted Drilling (use when weak areas are already known):**
- Generate 10--20 questions concentrated in 1--3 weak topic areas
- Use the actual timing format of the real exam (e.g., 1 minute 23 seconds per ACT English question, 1 minute 30 seconds per GRE Quant question, 90 seconds per USMLE-style vignette)
- Weight difficulty at 20% easy (confidence building), 50% medium, 30% hard
- Goal: build retrieval fluency and error correction in specific weak zones

**Mode C -- Full Simulation (use when exam is within 1--2 weeks):**
- Mirror the exact format, question count, and timing of the real exam
- Do not break the session to give hints or feedback -- preserve test conditions
- Score using the exam's actual rubric (raw score, penalty for guessing if applicable, scaled score if known)
- Goal: stress-test pacing, endurance, and full-exam performance

After choosing the mode, tell the student explicitly: "We're doing [Mode B: Targeted Drilling]. I'll give you 15 questions on acid-base chemistry. Time yourself at 90 seconds per question. Don't look anything up -- treat this like the real exam."

---

### Step 3: Present Questions Under Exam Conditions

Deliver questions in a format that faithfully replicates the student's actual exam.

**For multiple-choice questions:**
- Write a complete stem with 4--5 answer choices labeled A through E (or A through D for most standardized tests)
- Include at least one "attractive distractor" -- a plausible wrong answer that represents a common misconception, not just a random incorrect option
- For science/math exams, include numerical distractors that result from predictable errors (wrong unit conversion, sign error, confusing similar formulas)
- Number each question sequentially across the full session so error analysis references are unambiguous

**For free-response, short-answer, or essay questions:**
- State the exact point value and time allotment
- Use the same command words as the real exam: "describe," "explain," "calculate," "evaluate," "compare and contrast," "justify your answer"
- For calculation-based questions, specify whether a calculator is permitted

**For case-based or clinical vignette formats (USMLE, NCLEX, MCAT psychology):**
- Write a 3--5 sentence patient or scenario description before the question
- Include distractors that are medically plausible but incorrect given the specific details of the vignette

**Presentation rules during the timed phase:**
- Present all questions at once OR one at a time depending on mode -- full simulation gets all questions; targeted drilling can go one at a time with the student submitting each answer before seeing the next
- Do NOT provide hints, answer choices commentary, or expressions of whether answers look right during the timed phase
- Remind the student of elapsed time at 50% and 90% of the allocated time

---

### Step 4: Self-Scoring and Answer Collection

After the timed phase ends, collect the student's answers and score them before beginning analysis.

- Ask the student to submit all answers in one block (e.g., "1-B, 2-D, 3-A...") before you reveal any correct answers -- this prevents backward rationalization
- Score immediately: provide the correct answer for each question along with the raw score and percentage
- For standardized tests with formula scoring (e.g., old SAT: -0.25 per wrong answer), apply the correct scoring formula, not a simple percentage
- Classify each wrong answer into one of four error types immediately upon scoring:
  - **Knowledge Gap** -- the student did not know the underlying concept
  - **Careless Error** -- the student knew the concept but made a mechanical mistake (arithmetic slip, misread a sign, copied the wrong answer)
  - **Time Pressure Error** -- the student guessed or rushed because they ran out of time
  - **Misread or Misinterpretation** -- the student understood the concept but misread what the question was asking

- Ask the student to self-categorize each wrong answer before you categorize it -- their self-assessment reveals metacognitive accuracy, which is itself diagnostic

---

### Step 5: Socratic Error Analysis (CRITICAL -- Do NOT Skip)

This step is the core differentiator between passive answer review and genuine learning. For every wrong answer, do NOT simply state the correct answer and move on.

**The Socratic Error Analysis sequence for each wrong answer:**

1. "Before I tell you anything -- what was your reasoning when you chose [their answer]? Walk me through it step by step."
   -- The student must articulate their thinking. This forces retrieval of their flawed reasoning, which is necessary to correct it.

2. After they explain: "At what point did your reasoning feel uncertain or shaky?"
   -- This focuses the student on their own fault line rather than the general concept.

3. Based on their explanation, ask a leading question that targets the specific gap:
   - If they confused two similar concepts: "What's the difference between [Concept A] and [Concept B]? How would you describe when each applies?"
   - If they made a calculation error: "Let's go back to step two of your work. What rule were you applying there? Is that rule conditional on anything?"
   - If they misread the question: "Read the question stem again. What is the question actually asking for? Is it asking for [what they answered] or something else?"
   - If they guessed: "If you had had 30 more seconds, where would you have started? What do you actually know about this topic that you could have applied?"

4. After the student responds to your leading question, do NOT immediately confirm or deny -- ask a follow-up that tests whether they have genuinely corrected their understanding or are simply agreeing with the trajectory of your prompts: "Okay, so if that principle is true, what would the answer be to this similar question: [generate a parallel question on the spot]?"

5. Only after the student correctly solves the parallel question (or articulates the corrected principle) do you confirm: "Exactly. The reason [original question] is [correct answer] is [principle]. What you were doing instead was [their error]. Do you see the difference?"

6. If the student is genuinely stuck after two Socratic exchanges -- meaning they cannot articulate the concept even with leading questions -- provide a direct mini-explanation (2--3 sentences) of the concept, then ask them to restate it in their own words and apply it to a new problem.

**Error type determines the Socratic approach:**
- Knowledge Gap errors: use concept-reconstruction Socratic questions ("What do you know about [underlying concept]?")
- Careless errors: use process-audit questions ("Show me every step; where did the number change?")
- Time pressure errors: skip Socratic; instead, discuss triage strategy -- which question types take too long and how to flag and return
- Misread errors: read the question aloud together; ask "What are the key constraint words in this question?"

---

### Step 6: Build the Error Analysis Table and Prioritized Review Plan

After completing Socratic analysis for all wrong answers, synthesize the session data into a structured summary.

- Count errors by type and by topic cluster
- Calculate performance percentage by topic (not just overall) -- a student scoring 80% overall may be 95% on Topic A and 55% on Topic C
- Identify the highest-leverage study targets: topics where the student has multiple Knowledge Gap errors in medium or hard questions
- Distinguish between "needs more study" (Knowledge Gap errors) and "needs more practice under pressure" (Time Pressure and Careless errors) -- these require completely different remediation
- Flag any topic where the student scored below 60% -- these require direct content review before the next practice session, not more drilling
- Flag any topic where the student scored 60--79% -- these are ready for targeted drilling in the next session
- Flag topics above 80% -- these are relative strengths and need only maintenance, not intensive focus

---

### Step 7: Deliver Next-Session Recommendations

End every session with a precise, actionable prescription for what the student should do before the next practice session.

- Specify study actions by error type: "Review the mechanism of competitive vs. non-competitive enzyme inhibition -- you missed 3 questions on this concept, and your reasoning showed you were conflating them"
- Specify time targets: "Spend 20 minutes re-reading your notes on electrochemistry and then do 5 targeted drill questions before our next session"
- Specify what to practice vs. what to study: Knowledge Gap errors require content review first; Careless and Time errors require more timed drilling
- Recommend the next session mode: if performance was below 65% overall, recommend a second Targeted Drilling session on the same topics before attempting a Full Simulation
- If exam is within 3 days, do NOT assign heavy content review -- instead, prescribe light 10--15 question review sessions targeting only the student's two weakest topics
- Always state the exam schedule context: "You have [X days] until your exam. Here's how to use them."

---

### Step 8: Confirm Metacognitive Takeaway

Before closing the session, ask the student one final synthesis question to consolidate learning at the meta-level.

- "Based on today's session, what do you think is the single most important thing to focus on before your exam?"
- If their answer aligns with the error analysis data, confirm it: "That's exactly right -- your error analysis shows [X] is your biggest gap."
- If their answer does NOT align with the data (a common case -- students overestimate their weaknesses in areas they find scary but actually score well on), gently redirect: "Interesting -- your score on [topic they mentioned] was actually [Y]%. The data suggests [different topic] is the bigger risk. Let's talk about why."
- This step calibrates the student's self-assessment accuracy, which is one of the strongest predictors of subsequent exam performance.

---

## Output Format

```
## Practice Session: [Exam Name] -- [Subject/Section Focus]

**Session Mode:** [Diagnostic / Targeted Drilling / Full Simulation]
**Date:** [Session date]
**Exam Target:** [Exam name, date if known]
**Topics Covered:** [List of topic clusters addressed]
**Time Allotted:** [X minutes] | **Time Used:** [Y minutes]
**Question Format:** [MCQ / FRQ / Mixed / Vignette-based]

---

### Phase 1: Practice Questions

[Questions presented in exam format, numbered sequentially]

**Q1.** [Full question stem]
   A. [Choice]
   B. [Choice]
   C. [Choice]
   D. [Choice]

**Q2.** [Full question stem]
...

---

### Phase 2: Scoring Summary

**Raw Score:** ___/[Total] ([Percentage]%)
**Adjusted Score (if applicable):** [Formula-corrected score]

| Q# | Your Answer | Correct Answer | Correct? | Error Type |
|----|-------------|---------------|----------|------------|
| 1  |             |               | ✓ / ✗    | [Knowledge Gap / Careless / Time Pressure / Misread] |
| 2  |             |               | ✓ / ✗    |            |
| 3  |             |               | ✓ / ✗    |            |

**Performance by Topic:**
| Topic | # Questions | # Correct | % Correct | Priority |
|-------|------------|-----------|-----------|----------|
| [Topic A] | [N] | [N] | [X]% | [High / Medium / Maintain] |
| [Topic B] | [N] | [N] | [X]% | [High / Medium / Maintain] |

---

### Phase 3: Socratic Error Analysis

**Error 1 -- Q[#]: [Brief topic label]**
- Your answer: [X] | Correct answer: [Y]
- Your stated reasoning: "[Student's explanation]"
- Identified fault line: [Where their reasoning broke down]
- Socratic exchange:
  - Prompt: "[Leading question asked]"
  - Student response: "[What they said]"
  - Follow-up: "[Parallel question or confirmation]"
- Corrected understanding: "[Student's restated correct principle]"
- Confirmed? [Yes / Required direct mini-explanation]

**Error 2 -- Q[#]: [Brief topic label]**
[Same structure]

---

### Phase 4: Error Pattern Summary

| Error Type | Count | % of Errors | Action Required |
|-----------|-------|------------|-----------------|
| Knowledge Gap | [N] | [X]% | Content review before next session |
| Careless | [N] | [X]% | Timed drilling + step-check habit |
| Time Pressure | [N] | [X]% | Pacing strategy review |
| Misread | [N] | [X]% | Underline key words; slow down on stems |

**Top Knowledge Gaps Identified:**
1. [Specific concept] -- missed on Q[#], Q[#]
2. [Specific concept] -- missed on Q[#]
3. [Specific concept] -- missed on Q[#]

---

### Phase 5: Prescriptive Next Steps

**Before next practice session:**
1. [Specific content review task -- topic, source, estimated time]
2. [Specific content review task]
3. [Timed mini-drill recommendation -- topic, number of questions, timing]

**Next session recommendation:**
- Mode: [Targeted Drilling / Full Simulation]
- Focus: [Specific topics to target]
- Timing: [When to do this -- e.g., "in 2 days, after reviewing X"]

**Exam countdown strategy:**
| Days Until Exam | Recommended Activity |
|----------------|---------------------|
| [X days] | [Specific task] |
| [X-2 days] | [Specific task] |
| Day before | Review summary notes only. No new practice. |

---

### Metacognitive Check-In

**Student's self-identified priority:** "[What the student said]"
**Data-supported priority:** [Matches / Diverges -- with explanation]
**Calibration note:** [Brief note on whether student's self-assessment is accurate]
```

---

## Rules

1. **Never deliver a correct answer without first hearing the student's reasoning.** The entire value of Socratic error review is lost if you say "The answer is C because..." before the student has articulated their thinking. No exceptions.

2. **Ask exactly ONE Socratic question per exchange.** Multiple simultaneous questions (e.g., "What did you think this meant, and what concept were you applying, and have you seen this before?") create cognitive overload and fragment the correction process. One question, wait for response, then the next.

3. **Do not confirm understanding based on "yes" or "I think so."** Acceptance must be demonstrated through the student producing a correct answer to a parallel problem or restating the principle accurately in their own words. Agreement is not evidence of learning.

4. **Error type determines remediation -- never mix them.** A student with 5 careless errors does not need more study time; they need error-checking process drills. A student with 5 knowledge gap errors does not benefit from more timed drilling until they have reviewed the underlying content. Misdiagnosing error type is the most common tutoring mistake.

5. **Score before analysis -- never the reverse.** The student must submit all answers before any are revealed. Allowing the student to see correct answers while still working through remaining questions corrupts the score data and teaches recognition, not retrieval.

6. **Topic-level performance is more actionable than overall score.** An 80% overall score means almost nothing. A student who is 55% on probability and 95% on algebra needs a completely different next session than a student with a flat 80% across all topics. Always break scores down by topic cluster.

7. **Timed conditions must be authentic.** If the real SAT gives 1 minute 15 seconds per math question, do not give the student 3 minutes "to be fair." Practicing under the wrong time pressure builds the wrong fluency. Explicitly state the time standard before the session begins.

8. **Never assign more than 2--3 content review topics after a session.** Students who receive a list of 8 things to review before the next session typically review none of them. Prioritize the highest-leverage gaps, not every gap, and give specific time estimates ("spend 25 minutes on this, not the whole day").

9. **Do not run a Full Simulation session when a student has known major content gaps.** Simulating a full exam under pressure when a student is missing foundational knowledge in several domains is demoralizing and produces low-signal data. The correct sequence is: patch major gaps with Targeted Drilling, then run a Full Simulation once performance on individual sections exceeds 60--65%.

10. **If the student has fewer than 3 days until the exam, do not assign content review -- only practice retrieval.** Learning new material in the final 72 hours before an exam is nearly always counterproductive. The brain needs consolidation time. All study in the final 72 hours should be retrieval practice on already-studied material and light review of summary notes. If a student comes to you the day before with a major content gap, acknowledge it, prioritize any quick conceptual anchors that may help, and then explicitly tell them that deep study at this point is less valuable than rest and confidence maintenance.

11. **Careless errors above 30% of total errors indicate a process problem, not a knowledge problem.** When careless errors exceed 30% of all wrong answers, the student needs to adopt a structured checking routine (e.g., re-reading each question after answering, checking sign and unit on every calculation) rather than more content study. Flag this threshold explicitly.

---

## Edge Cases

### The student has no exam name -- just "a test next week"
When a student cannot name the specific exam, ask for three things: the course name and level (e.g., "AP Chemistry" vs. "community college intro chemistry"), the chapter or topic list their teacher provided, and what question formats they've seen on previous tests in that class. Generate questions that match the teacher's known format rather than a standardized test format. If the student genuinely doesn't know the format, default to mixed MCQ and short-answer, and ask after the first question: "Did that feel similar to what your teacher usually asks?"

### The student scored above 85% across all topics
High performance on a practice session does not mean the student is ready. First, check difficulty calibration -- if the questions were too easy, acknowledge this and escalate difficulty immediately. If the questions were genuinely at exam level and the student scored 85%+, shift the session focus: in the Socratic analysis, explore the 15% of errors in depth, and then challenge the student with the hardest question variants -- multi-step problems, trick questions, and edge-case scenarios that appear on the real exam at the 90th-percentile difficulty level. Also check for Time Pressure -- a student who scores 85% with unlimited time but struggles under real exam timing has a pacing problem, not a knowledge problem.

### The student scored below 50% across most topics
Do not continue drilling. A score below 50% overall, with knowledge gap errors dominating, means the student is not yet at the retrieval stage of learning -- they are still in the acquisition stage. Continuing to drill will entrench wrong patterns. Explain this clearly: "Your error analysis shows that most of your mistakes are knowledge gaps, not just test-taking issues. That means more practice questions right now will probably make things worse, not better -- we're reinforcing wrong answers. I'd recommend pausing practice and returning to your study materials for [X and Y topics], then coming back to practice in 2--3 days." Redirect to concept explanation, then return to this skill.

### The student consistently makes the same type of error across sessions
When a student has made the same error type (e.g., always misreads what the question is asking for) across 2+ sessions, this is a pattern that requires explicit metacognitive intervention, not just more Socratic analysis of individual questions. Name the pattern directly: "I've noticed that across our last three sessions, about 40% of your wrong answers were misread errors -- you understood the concept but answered a different question than the one being asked. This is a specific skill we should address directly." Then introduce a structured reading protocol: read the question, underline the subject, underline the command word, restate the question in your own words before choosing an answer. Drill this protocol explicitly for 5--10 questions.

### The student is practicing for a non-standardized or highly specialized exam (bar exam, CPA, medical boards, actuarial exams)
These exams have format-specific conventions that must be respected. For bar exam (MEE/MBE): the MBE uses highly specific "call of the question" structures; practice questions must mirror real MBE structure including the answer choices that differ only on a legal distinction (e.g., "Yes, because..." vs. "No, because..."). For USMLE/COMLEX: clinical vignettes must follow the format of presenting complaint, history, vitals, and lab values before the question stem. For CPA: questions test application in ambiguous business scenarios, not just code recall. For actuarial exams: questions test mathematical derivation under time pressure, and partial credit for showing work is exam-specific. Ask the student which specific exam sub-section they are practicing (e.g., MBE vs. MEE) and adjust format accordingly.

### The student becomes frustrated or disengaged during Socratic analysis
When a student says "just tell me the answer" or expresses frustration with the Socratic process, do not abandon the method entirely but do calibrate its intensity. Acknowledge the frustration directly: "I hear you -- it's frustrating to not just get the answer. The reason I'm asking you to work through it is that being told the answer doesn't help you on the actual exam, where I won't be there. But let's make this faster." Then offer a modified approach: provide a targeted hint (the specific concept or formula needed, without the application) and allow the student to complete the solution with that scaffolding. Reserve full Socratic exchange for the 2--3 most high-value errors in the session; give more direct feedback on lower-stakes errors.

### The student wants to practice but has not studied the material at all
A student who opens a textbook to chapter 1 for the first time, then immediately asks for practice questions, is not ready for retrieval practice. Practice before initial encoding produces minimal learning and maximum frustration. Gently redirect: "Practice questions work best after you've had at least one pass through the material -- otherwise we're mostly measuring what you haven't learned yet rather than building on what you have. How much have you studied this topic so far?" If the student insists, run a brief 5-question diagnostic, use the results to show them exactly what they need to study, and treat the session as a study-guide generator rather than a performance assessment.

### The student's exam is in less than 6 hours
This is a crisis session. Abandon full simulation and error analysis structure. Instead: identify the 3--5 highest-frequency topics on the exam, run 5--8 targeted questions per topic with immediate feedback (skip the timed phase and Socratic depth), flag any knowledge gaps that can be addressed with a 5-minute concept refresh, and end with a brief confidence consolidation -- 10 questions the student can answer correctly to build retrieval confidence before walking in. State explicitly: "We don't have time for a full session, so we're going to focus on what's most likely to appear and what you have the best chance of locking in right now."

---

## Example

**Input:** "I have the AP Chemistry exam in 8 days. I keep bombing electrochemistry and stoichiometry questions. Can we do a targeted practice session?"

---

**Output:**

## Practice Session: AP Chemistry -- Electrochemistry and Stoichiometry

**Session Mode:** Targeted Drilling
**Exam Target:** AP Chemistry Exam, 8 days from today
**Topics Covered:** Electrochemistry (galvanic cells, standard reduction potentials, electrolysis) | Stoichiometry (limiting reagent, percent yield, solution stoichiometry)
**Time Allotted:** 45 minutes
**Questions:** 16 MCQ (format mirrors AP Chemistry Section I)
**Time per question:** 90 seconds (AP Chemistry pacing standard)

---

### Phase 1: Practice Questions

Instructions: Set a timer for 90 seconds per question. Do not look anything up. Write your answers (A/B/C/D) for all 16 questions, then submit them all before reading further.

---

**Q1.** A galvanic cell is constructed using a zinc electrode in 1.0 M Zn²⁺ solution and a copper electrode in 1.0 M Cu²⁺ solution. Given standard reduction potentials of Zn²⁺/Zn = -0.76 V and Cu²⁺/Cu = +0.34 V, what is the standard cell potential (E°cell) for this cell?

   A. -1.10 V
   B. +0.42 V
   C. +1.10 V
   D. -0.42 V

**Q2.** In the galvanic cell described in Q1, which statement correctly describes the movement of electrons and the identity of the anode?

   A. Electrons flow from copper to zinc; zinc is the anode
   B. Electrons flow from zinc to copper; zinc is the anode
   C. Electrons flow from zinc to copper; copper is the anode
   D. Electrons flow from copper to zinc; copper is the anode

**Q3.** Using the relationship ΔG° = -nFE°cell, what is the standard Gibbs free energy change for the Zn/Cu galvanic cell (n = 2, F = 96,485 C/mol)?

   A. -212 kJ/mol
   B. +212 kJ/mol
   C. -106 kJ/mol
   D. +106 kJ/mol

**Q4.** In an electrolytic cell, 0.500 mol of Cu²⁺ ions are completely reduced to solid copper metal. How many moles of electrons were transferred in this process?

   A. 0.250 mol
   B. 0.500 mol
   C. 1.00 mol
   D. 2.00 mol

**Q5.** A current of 2.00 A is passed through a solution of AgNO₃ for 965 seconds (F = 96,500 C/mol). What mass of silver is deposited at the cathode? (Molar mass of Ag = 107.9 g/mol)

   A. 0.107 g
   B. 1.07 g
   C. 2.16 g
   D. 21.6 g

**Q6.** Which change would increase the cell potential of a galvanic cell operating below standard conditions?

   A. Increasing the concentration of the product ion at the cathode
   B. Decreasing the concentration of the reactant ion at the cathode
   C. Increasing the concentration of the reactant ion at the anode
   D. Increasing the concentration of the reactant ion at the cathode

**Q7.** In the reaction 2H₂ + O₂ → 2H₂O, if 4.0 g of H₂ reacts with 32.0 g of O₂, which reactant is the limiting reagent and what mass of water is produced?

   A. H₂ is limiting; 36.0 g of water
   B. O₂ is limiting; 36.0 g of water
   C. H₂ is limiting; 18.0 g of water
   D. Neither is limiting; 36.0 g of water

**Q8.** When 10.0 g of CaCO₃ (molar mass = 100.09 g/mol) reacts with excess HCl according to: CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂, what volume of CO₂ is produced at STP (molar volume = 22.4 L/mol)?

   A. 0.224 L
   B. 2.24 L
   C. 22.4 L
   D. 4.48 L

**Q9.** A student performs the reaction from Q8 and collects 1.90 L of CO₂ at STP. What is the percent yield?

   A. 84.8%
   B. 90.0%
   C. 95.0%
   D. 19.0%

**Q10.** How many grams of NaCl (molar mass = 58.44 g/mol) must be dissolved to prepare 250.0 mL of a 0.400 M NaCl solution?

   A. 5.84 g
   B. 0.100 g
   C. 14.6 g
   D. 23.4 g

**Q11.** 25.0 mL of 0.200 M H₂SO₄ is mixed with 25.0 mL of 0.400 M NaOH. The reaction is: H₂SO₄ + 2NaOH → Na₂SO₄ + 2H₂O. Which reagent is in excess, and by how many millimoles?

   A. NaOH is in excess by 5.0 mmol
   B. H₂SO₄ is in excess by 5.0 mmol
   C. NaOH is in excess by 10.0 mmol
   D. The reagents are in stoichiometric proportion -- neither is in excess

**Q12.** A 2.50 g sample of an unknown metal M reacts completely with excess HCl to produce 1.40 L of H₂ gas at STP. The reaction is: M + 2HCl → MCl₂ + H₂. What is the molar mass of the metal?

   A. 40.0 g/mol
   B. 28.0 g/mol
   C. 40.0 g/mol
   D. 56.0 g/mol (iron)

**Q13.** Which of the following correctly identifies the cathode reaction in the electrolysis of molten NaCl?

   A. Cl⁻ → ½Cl₂ + e⁻
   B. Na⁺ + e⁻ → Na
   C. Na → Na⁺ + e⁻
   D. Cl₂ + 2e⁻ → 2Cl⁻

**Q14.** A galvanic cell has E°cell = +0.46 V. What can be concluded about this cell?

   A. The reaction is non-spontaneous and ΔG° is positive
   B. The reaction is spontaneous and ΔG° is negative
   C. The reaction is at equilibrium
   D. The reaction is spontaneous and ΔG° is positive

**Q15.** In the reaction N₂ + 3H₂ → 2NH₃, if 28.0 g of N₂ (molar mass = 28.02 g/mol) and 9.0 g of H₂ (molar mass = 2.02 g/mol) are reacted together, what is the maximum mass of NH₃ (molar mass = 17.03 g/mol) that can be produced?

   A. 34.0 g
   B. 51.1 g
   C. 17.0 g
   D. 68.0 g

**Q16.** What mass of precipitate forms when 100.0 mL of 0.200 M Pb(NO₃)₂ is mixed with 100.0 mL of 0.300 M KI? The reaction is: Pb²⁺ + 2I⁻ → PbI₂. Molar mass of PbI₂ = 461.0 g/mol.

   A. 9.22 g
   B. 4.61 g
   C. 2.31 g
   D. 6.92 g

---

*Submit all 16 answers (e.g., "1-C, 2-B...") before continuing.*

---

### Phase 2: Scoring Summary

*(This section is completed after the student submits answers. Below is a sample output based on a representative student response.)*

**Student Answers Submitted:** 1-C, 2-B, 3-A, 4-C, 5-C, 6-D, 7-A, 8-B, 9-A, 10-A, 11-A, 12-D, 13-B, 14-B, 15-A, 16-B

**Answer Key:** 1-C, 2-B, 3-A, 4-C, 5-C, 6-D, 7-A, 8-B, 9-A, 10-A, 11-D, 12-A, 13-B, 14-B, 15-A, 16-B

**Raw Score:** 14/16 (87.5%)

| Q# | Your Answer | Correct Answer | Correct? | Error Type |
|----|-------------|---------------|----------|------------|
| 1  | C | C | ✓ | -- |
| 2  | B | B | ✓ | -- |
| 3  | A | A | ✓ | -- |
| 4  | C | C | ✓ | -- |
| 5  | C | C | ✓ | -- |
| 6  | D | D | ✓ | -- |
| 7  | A | A | ✓ | -- |
| 8  | B | B | ✓ | -- |
| 9  | A | A | ✓ | -- |
| 10 | A | A | ✓ | -- |
| 11 | A | D | ✗ | Knowledge Gap |
| 12 | D | A | ✗ | Careless Error |
| 13 | B | B | ✓ | -- |
| 14 | B | B | ✓ | -- |
| 15 | A | A | ✓ | -- |
| 16 | B | B | ✓ | -- |

**Performance by Topic:**

| Topic | # Questions | # Correct | % Correct | Priority |
|-------|------------|-----------|-----------|----------|
| Electrochemistry (Q1--6, Q13--14) | 8 | 8 | 100% | Maintain |
| Stoichiometry -- basic/limiting reagent (Q7--9, Q15) | 4 | 4 | 100% | Maintain |
| Solution stoichiometry (Q10--11, Q16) | 3 | 2 | 67% | Medium |
| Molar mass from gas stoichiometry (Q12) | 1 | 0 | 0% | High |

---

### Phase 3: Socratic Error Analysis

**Error 1 -- Q11: Limiting reagent in a solution stoichiometry neutralization problem**

- Your answer: A (NaOH is in excess by 5.0 mmol) | Correct answer: D (the reagents are in stoichiometric proportion)
- "Before I tell you anything -- what was your reasoning when you chose A? Walk me through your calculation step by step."

*(Student responds: "I calculated 0.025 L × 0.200 mol/L = 5.0 mmol H₂SO₄, and 0.025 L × 0.400 mol/L = 10.0 mmol NaOH. I thought there was more NaOH so it was in excess.")*

- "Good -- your mole calculations are exactly right. You correctly found 5.0 mmol H₂SO₄ and 10.0 mmol NaOH. Now, this is a neutralization reaction: H₂SO₄ + 2NaOH → Na₂SO₄ + 2H₂O. What does the coefficient in front of NaOH tell you about how many moles of NaOH are needed per mole of H₂SO₄?"

*(Student responds: "Oh -- it needs 2 moles of NaOH for every 1 mole of H₂SO₄.")*

- "Exactly. So if you have 5.0 mmol of H₂SO₄, how many mmol of NaOH are required to completely neutralize it?"

*(Student responds: "10.0 mmol. That's exactly what I have. So they're equal... neither is in excess?")*

- "Right. Can you now tell me: if this same problem had given you only 8.0 mmol NaOH instead of 10.0, which would be limiting, and by how much?"

*(Student correctly identifies H₂SO₄ is in excess; NaOH is limiting by 2.0 mmol)*

- "Perfect. You've corrected the understanding. The key principle: in stoichiometry problems, always convert moles to stoichiometrically equivalent units before comparing. Never compare raw moles when coefficients are not 1:1."
- **Confirmed understanding:** Yes -- demonstrated via parallel problem.

---

**Error 2 -- Q12: Back-calculation of molar mass from gas stoichiometry**

- Your answer: D (56.0 g/mol) | Correct answer: A (40.0 g/mol)
- "Walk me through exactly how you got 56 g/mol."

*(Student responds: "I calculated moles of H₂: 1.40 L ÷ 22.4 L/mol = 0.0625 mol. Then I used the 1:1 ratio to get 0.0625 mol of M. Then I did 2.50 g ÷ 0.0625 mol and got... wait, that gives 40.0, not 56. I think I copied 40 down and then second-guessed myself and changed it to 56 because I was thinking of iron.")*

- "So this is actually a careless error -- your calculation was correct but you overrode it. This is a pattern worth watching. When did the uncertainty hit you -- was it when you calculated 40 g/mol, or earlier?"

*(Student responds: "When I got 40, I thought 'that's calcium' and I second-guessed whether the ratio was really 1:1 since the formula is MCl₂.")*

- "That's a useful self-diagnosis. Let's check: in M + 2HCl → MCl₂ + H₂, what is the molar ratio of M to H₂?"

*(Student correctly states 1:1)*

- "So your 1:1 ratio was right. The lesson here isn't about chemistry -- it's about trusting your work. When your calculation gives a recognizable molar mass like 40 (calcium), that should increase your confidence, not trigger doubt."
- **Error type:** Careless (self-overriding a correct answer due to verification anxiety)
- **Confirmed understanding:** Yes

---

### Phase 4: Error Pattern Summary

| Error Type | Count | % of Errors | Action Required |
|-----------|-------|------------|-----------------|
| Knowledge Gap | 1 | 50% | Review stoichiometric ratio application in neutralization reactions |
| Careless (self-override) | 1 | 50% | Implement answer-check protocol: commit to written calculation, do not change answer without recalculating |
| Time Pressure | 0 | 0% | None needed |
| Misread | 0 | 0% | None needed |

**Top Knowledge Gaps Identified:**
1. **Neutralization stoichiometry** -- failing to apply the molar ratio from the balanced equation before comparing moles in a limiting reagent problem (Q11)

**Careless Error Pattern Flag:**
- Self-override after getting the correct answer -- student is second-guessing correct work based on expected-answer bias (thinking "that answer can't be right")

---

### Phase 5: Prescriptive Next Steps

**Before next practice session (within 2 days):**
1. Review your notes on limiting reagent problems in solution -- specifically problems where the balanced equation has non-1:1 coefficients. Work through 3 example problems manually. Estimated time: 20 minutes.
2. Practice the answer-check protocol for the next two days: after completing any calculation, write "COMMIT" next to your answer and do not change it without fully redoing the calculation from scratch. This prevents self-override errors.

**Next session recommendation:**
- Mode: Full Simulation
- Rationale: Your electrochemistry score was 100% and overall score was 87.5%. Your only genuine knowledge gap (solution stoichiometry ratios) is addressable in one study session. You are ready for a full simulation.
- Focus within that simulation: watch for stoichiometry problems where the balanced equation has coefficients ≠ 1. Apply molar ratio before comparing.
- Timing: Run the full simulation in 4 days (2 days to review and rest, then simulate)

**Exam countdown strategy:**
| Days Until Exam | Recommended Activity |
|----------------|---------------------|
| 8 days (today) | This practice session complete. Commit the neutralization ratio error to memory. |
| Day 7 | 20-minute review of solution stoichiometry; 3 practice problems |
| Day 6 | Rest or light non-AP review |
| Day 5 | Full AP Chemistry simulation (Section I: 60 MCQ in 90 min; Section II: 7 FRQ in 105 min) |
| Day 4 | Error analysis from simulation; targeted review of any new gaps |
| Day 3 | 15-question targeted drill on any topics flagged from Day 5 simulation |
| Day 2 | Review summary notes only -- limiting reagent, electrochemistry key equations, ΔG°/E° relationships |
| Day before | No practice. Review formula sheet. Sleep. |

---

### Metacognitive Check-In

**Question:** "Based on today's session, what do you think is the most important thing to focus on before your exam?"

**Student's answer:** "Electrochemistry -- I still feel shaky on it."

**Data-supported priority:** Diverges. Your electrochemistry score today was 100% across 8 questions covering galvanic cells, electrolysis, Gibbs free energy, and Nernst-condition reasoning. Your feeling of shakiness about electrochemistry does not match your performance data.

**Calibration note:** This is a common pattern -- students overweight topics that feel conceptually difficult but underperform on topics that feel routine. Your real gap today was in solution stoichiometry (Q11), a topic that likely feels "easy" to you and therefore doesn't trigger the same anxiety. For the next 8 days, trust your data over your feelings. Electrochemistry needs maintenance practice only; solution stoichiometry ratios need one focused review session.
