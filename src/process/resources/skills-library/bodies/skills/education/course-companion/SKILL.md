---
name: course-companion
description: |
  Creates study guides and companion materials for online or in-person courses, including key terms, review questions, project ideas, and connection summaries for learners following a structured course.
  Use when a learner asks for help studying alongside a course, wants a study guide for course material, or needs companion questions and exercises for a course they are taking.
  Do NOT use for designing an online course (use `online-course-design`), for standalone study planning (use `study-plan`), or for book summarization (use `book-summary`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "study-skills step-by-step guide teaching"
  category: "education"
  subcategory: "self-learning"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Course Companion

## When to Use

Use this skill when the learner is enrolled in or actively following a structured course -- online or in-person -- and needs materials that help them engage more deeply with course content, not just passively consume it.

**Use when:**
- A learner asks for a study guide, companion notes, or review materials for a specific course module or week they are currently studying
- A student wants to convert raw lecture notes, slide decks, or transcripts into organized, self-testable reference materials
- A learner wants review questions, vocabulary reinforcement, and project ideas tied directly to their course structure
- A user is following a self-paced online course (e.g., recorded lectures, MOOCs) and wants structured checkpoints to prevent passive watching
- A learner wants to surface connections between modules -- understanding how Week 3 builds on Week 1, or how a concept in one unit recurs in another
- A student preparing for a midterm or final wants a structured, module-by-module review document rather than a single exam-prep session
- A learner is returning to a course after a break and wants to quickly reconstruct what they have already covered

**Do NOT use when:**
- The user is an educator designing course structure, learning objectives, or curriculum -- use `online-course-design` instead
- The user wants a standalone study schedule with time blocks and deadlines -- use `study-plan` instead
- The user wants to summarize a book chapter not tied to a course -- use `book-summary` instead
- The user wants practice questions in exam format (multiple choice, timed, scored) -- use `exam-practice` instead
- The user wants to learn a language, including vocabulary and grammar drills -- use language-learning skills instead
- The user is asking for a topic explainer with no course structure behind it -- use `concept-explainer` instead
- The user wants to take general notes on a lecture with no structured output -- use `lecture-notes` instead

---

## Process

### Step 1: Gather Course Context Before Producing Anything

Do not produce any companion materials without first establishing the course structure. Ask the learner for the following -- all at once in a single message, not as repeated follow-ups:

- **Course name and subject area** (e.g., "Introductory Microeconomics," "Machine Learning Fundamentals")
- **Course platform or setting** (e.g., university course, Coursera, in-person bootcamp, textbook-based self-study)
- **Total number of modules/weeks and which module(s) to cover now** -- if the learner says "all of them," scope the first session to one module and note you will continue for subsequent ones
- **Source material for this module** -- what can they share? Lecture notes, slide headings, a transcript, a textbook chapter outline, or just topic names they have been given? The richer the input, the richer the output.
- **The learner's prior knowledge level** -- complete beginner, some exposure, or has studied adjacent fields?
- **Primary purpose** -- is this for exam preparation, genuine deep understanding, professional application, or building a portfolio project?

If the learner provides a partial answer, make reasonable inferences but flag what you assumed. Never invent course content -- only work with what the learner provides.

### Step 2: Identify the Structural Architecture of the Course

Before writing any companion content, map the course structure explicitly. This becomes the skeleton of the entire companion guide.

- Identify the **progression logic**: Is this course building sequentially (each module depends on the prior one, like calculus), or is it modular and parallel (each module is semi-independent, like a survey course)?
- Identify the **conceptual spine**: What is the single overarching question or problem the course is trying to answer? Every module should connect back to this. For example, a microeconomics course's spine is "How do individuals and firms make decisions under scarcity and competition?"
- Map **which modules introduce core concepts** vs. which modules apply, extend, or synthesize them. Tag each module as: Foundation, Application, Extension, or Synthesis.
- Note any **prerequisite chains** -- concept A must be understood before concept B can be learned. Identify these within the course content, not just between courses.
- If the learner only provides topic names (no notes), use your domain knowledge to infer what the module likely covers, and flag this clearly: "Based on the topic name, I'm assuming this module covers X, Y, Z -- correct me if your course covers it differently."

### Step 3: Build the Key Terms Glossary with Precision

A Course Companion glossary is fundamentally different from a dictionary definition list. Each entry must do four things simultaneously: define precisely, distinguish from confusable neighbors, anchor with an example, and flag a common misconception.

- Write definitions **in the learner's own register** -- a first-year undergraduate needs different language than a graduate student
- For every term, identify at least one **confusable neighbor** -- a term students routinely mix up with this one. State the distinction explicitly.
  - Example: "Correlation vs. causation -- correlation means two variables change together; causation means one change forces the other. A rooster crowing before sunrise is correlated with sunrise but does not cause it."
- Provide **two types of examples**: one from the course's canonical example (the textbook case), and one novel example the learner invented or that you generate from an adjacent domain
- Flag **terms with multiple meanings** across disciplines. A term like "discrimination" means something different in psychology (stimulus discrimination in conditioning) vs. economics (price discrimination) vs. sociology. Note which meaning applies here.
- Aim for **8-15 terms per module** as a target range. Fewer than 8 suggests the material is thin; more than 20 suggests you need to split into sub-sections or the learner is conflating multiple modules.

### Step 4: Construct Three-Tier Review Questions

Review questions must operate at three cognitive levels corresponding to Bloom's Taxonomy tiers -- not as an academic exercise, but because passive learners default to recognition-level questions and never develop transfer ability.

**Tier 1 -- Recall (Foundation):** Can the learner retrieve the core fact or definition?
- These questions matter but are insufficient on their own. They test whether the material was encoded at all.
- Example format: "Define X in one sentence" or "Name the four stages of Y"

**Tier 2 -- Conceptual Understanding:** Can the learner explain why, compare two concepts, or identify the mechanism?
- This is where most study guides are weak. These questions require the learner to construct meaning, not just retrieve labels.
- Example format: "Explain why X leads to Y rather than Z" or "What would happen if condition A were removed from the process?"

**Tier 3 -- Application and Transfer:** Can the learner apply the concept to a new scenario they have not seen before?
- These questions predict real-world performance and exam performance better than Tier 1 and 2 combined.
- Example format: "You are given the following scenario -- which concept from this module applies, and why?" or "Design a simple experiment that would test the relationship between X and Y."

**Target:** 3 Tier-1 questions, 3 Tier-2 questions, and 2-3 Tier-3 questions per module. Write the questions first; write the answer keys second.

### Step 5: Surface Module Connections Explicitly

This is the most commonly missing element in self-made study guides and the one that produces the deepest learning gains.

- For every module, identify **forward connections** (concepts introduced here that will be developed later) and **backward connections** (concepts from earlier modules that this module applies or extends)
- Write these as explicit statements, not vague suggestions: "The supply-demand equilibrium model from Module 1 is directly applied here to explain why price ceilings create shortages. If you are unclear on equilibrium, review Module 1 Section 3 before proceeding."
- Identify **analogical connections** -- places where the structure of this module mirrors the structure of a concept from a completely different field. These cross-domain analogies are powerful memory anchors.
- Flag **concepts that contradict intuition** -- these are the places where learners are most likely to maintain naive misconceptions even after studying. Misconception + correct concept + explanation of why the wrong intuition feels right = the most effective correction pattern.

### Step 6: Generate Practice Exercises and Project Ideas

Exercises and projects are not decorations. They are the mechanism by which declarative knowledge (knowing that) converts to procedural knowledge (knowing how).

- **Exercises** should be completable in 10-30 minutes with only the module's materials and general reasoning ability. They must have a verifiable output -- something the learner can check or share.
  - Good exercise: "Take the supply-demand model and apply it to the current housing rental market in any city you choose. Draw the diagram and explain one policy intervention and its likely effect."
  - Weak exercise: "Think about how supply and demand affect real life." (No verifiable output, no constraint, no reasoning required)
- **Projects** should require 1-4 hours of effort and integrate at least two concepts from the module, ideally plus one concept from a prior module.
- Categorize projects by type: **Analytical** (analyze existing data or a case study), **Creative** (build, design, or write something new), **Explanatory** (teach the concept to someone else in a specific format), or **Applied** (use the concept to solve a real problem in the learner's own life or work context)
- Offer one project of each type if possible, and let the learner choose the type that matches their learning style and purpose.

### Step 7: Build the Self-Assessment Checklist and Spaced Repetition Schedule

Self-assessment must be specific enough to catch actual gaps, not just provide reassurance.

- Replace generic "Did you understand this?" prompts with **demonstrative challenges**: "Without looking at your notes, draw the full diagram of X and label all components" or "Explain the difference between A and B in 2 sentences to an imaginary friend who knows nothing about this course"
- Use a **traffic light system** for each concept: Green (can explain and apply without notes), Yellow (understand but need notes to apply correctly), Red (still unclear on the definition itself). Greens need spaced review; Yellows need active practice; Reds need re-study before anything else.
- Provide a **concrete spaced repetition schedule** based on the standard forgetting curve intervals adapted for course-based learning:
  - Review 1: 24 hours after first study
  - Review 2: 3 days after Review 1
  - Review 3: 7 days after Review 2
  - Review 4: Before the next related exam or module assessment
- Flag which concepts are highest-yield for the learner's stated purpose. If the purpose is exam prep, Tier-1 and Tier-2 questions on foundational terms are highest-yield. If the purpose is application, Tier-3 exercises and projects are highest-yield.

### Step 8: Deliver the Full Companion Document and Invite Iteration

- Deliver the complete structured document in the Output Format below
- After delivery, explicitly ask: "Which module should I build next?" and "Are there any concepts in this module that need more depth or a different explanation approach?"
- If the learner flagged any Red concepts in the self-assessment, offer immediately to re-explain those concepts using a different approach (analogy, diagram description, worked example, Socratic questioning)
- Note the spaced repetition schedule in a place the learner can copy easily

---

## Output Format

```
## Course Companion: [Course Name]

**Subject Area:** [e.g., Behavioral Psychology / Machine Learning / Corporate Finance]
**Course Platform/Setting:** [e.g., University lecture, Coursera, self-study with textbook]
**Module Covered:** [Module number and title]
**Module Type:** [Foundation / Application / Extension / Synthesis]
**Learner Level:** [Beginner / Intermediate / Advanced]
**Companion Purpose:** [Exam prep / Deep understanding / Professional application / Portfolio project]
**Source Material Used:** [Brief description of what the learner provided]
**Date Created:** [Date]

---

### Conceptual Spine

> [One sentence stating the overarching question this course is answering]
> This module's contribution: [One sentence on what this module adds to that answer]

---

### Key Terms Glossary

| Term | Precise Definition | Distinguished From | Example | Common Misconception |
|------|-------------------|-------------------|---------|---------------------|
| [Term] | [Definition in accessible language] | [Confusable neighbor + contrast] | [Canonical example + novel example] | [What students get wrong] |
| ... | ... | ... | ... | ... |

---

### Core Concepts

#### Concept 1: [Name]
**What it is:** [2-3 sentence explanation at the learner's level]
**Why it matters:** [Connection to the course's conceptual spine]
**The mechanism:** [How it works step by step -- use numbered list if sequential]
**Counterintuitive element:** [The thing that trips people up and why their intuition misleads them]

#### Concept 2: [Name]
[Same structure]

[Continue for all major concepts in the module -- typically 3-6]

---

### Module Connections

**Builds on:**
- [Module X, Concept Y] -- [Specific explanation of how the current concept extends or applies the prior one]

**Prepares for:**
- [Future module topic] -- [What the learner should watch for in upcoming modules]

**Cross-domain analogy:**
- [This concept mirrors X from field Y because...]

---

### Review Questions

#### Tier 1 -- Recall
1. [Question]
2. [Question]
3. [Question]

#### Tier 2 -- Conceptual Understanding
1. [Question]
2. [Question]
3. [Question]

#### Tier 3 -- Application and Transfer
1. [Question/Scenario]
2. [Question/Scenario]

**Answer Key:**
*(Use only after attempting each question)*
- T1-1: [Answer]
- T1-2: [Answer]
- T1-3: [Answer]
- T2-1: [Answer -- not just the conclusion, but the reasoning chain]
- T2-2: [Answer]
- T2-3: [Answer]
- T3-1: [Model answer -- note that multiple valid answers may exist]
- T3-2: [Model answer]

---

### Practice Exercises

**Exercise (15-20 min):** [Specific, constrained task with a verifiable output]
*What to check:* [How the learner knows they did it correctly]

**Extension Exercise (30 min, optional):** [More challenging version for learners who want depth]

---

### Project Ideas

| Project Type | Title | Description | Time Estimate | Concepts Applied |
|-------------|-------|-------------|---------------|-----------------|
| Analytical | [Name] | [Description] | [X hours] | [Concept A, B] |
| Creative | [Name] | [Description] | [X hours] | [Concept B, C] |
| Explanatory | [Name] | [Description] | [X hours] | [Concept A, B, C] |
| Applied | [Name] | [Description] | [X hours] | [Concept A, C] |

---

### Self-Assessment Checklist

For each concept below, rate yourself: 🟢 Can explain and apply without notes | 🟡 Understand but need notes | 🔴 Still unclear

| Concept | Rating | If Yellow: Practice recommendation | If Red: Re-study action |
|---------|--------|-----------------------------------|------------------------|
| [Concept 1] | [ ] | [Specific exercise] | [Specific re-study step] |
| [Concept 2] | [ ] | [Specific exercise] | [Specific re-study step] |

**Demonstrative Challenges:**
- Without notes: Draw/write [specific diagram or explanation]. If you cannot complete it, mark that concept Red.
- Without notes: Explain [key distinction] to someone who knows nothing about this course in 2 sentences.

---

### Spaced Repetition Schedule

| Review Session | Timing | What to Review | Method |
|---------------|--------|----------------|--------|
| Review 1 | [Date: tomorrow] | All Red concepts + Tier 1 questions | Re-read definitions, redo Tier 1 questions |
| Review 2 | [Date: +3 days] | Yellow concepts + Tier 2 questions | Answer Tier 2 without notes |
| Review 3 | [Date: +10 days] | Full module + Tier 3 application | Complete one project or transfer exercise |
| Review 4 | [Before exam/next related module] | Full glossary + all review questions | Timed self-quiz |

---

### Next Steps
- **Next module companion:** [When ready, provide the next module's material and I will build Module X+1]
- **Suggested follow-up skill:** [e.g., flashcard-generation for the key terms table, exam-practice for Tier-3 question drilling]
- **Red concept support:** [If any concepts were marked Red, ask me to re-explain them using an analogy / diagram / worked example]
```

---

## Rules

1. **Never produce companion content without source material.** If the learner only says "I'm taking a psychology course," ask for module topics, notes, or slide headings before writing a single term definition. Companion materials built without source material are generic and counterproductive -- they teach the AI's version of the course, not the course the learner is actually taking.

2. **Use the learner's exact terminology, not canonical alternatives.** If the course uses "activation energy" but a common alternative is "energy barrier," use the course's term as the primary heading and note the alternative in parentheses. Learners are assessed on their course's vocabulary, not on cross-textbook standardization.

3. **Every term definition must include a confusable neighbor.** Terms studied in isolation are forgotten. Terms studied in contrast are retained. This is not optional even if the learner does not ask for it.

4. **All three tiers of review questions are mandatory.** If a learner provides only simple factual content (e.g., a vocabulary list with no context), generate Tier-2 and Tier-3 questions by applying those terms to the most likely real-world or course-typical scenarios -- but flag that you are doing so and invite correction.

5. **The answer key must explain the reasoning, not just state the answer.** For Tier-2 and Tier-3 questions especially, "The answer is B" is useless. The learner needs to see the chain of reasoning that produces B, because that reasoning chain is what transfers to novel problems.

6. **Do not conflate modules.** If a learner asks for a companion for "Module 3," do not import concepts from Module 5 as if they are pre-requisites. Only reference future modules as forward connections, clearly labeled as "you will see this again in..."

7. **The Module Type tag (Foundation / Application / Extension / Synthesis) determines the emphasis.** Foundation modules need more Tier-1 questions and heavier glossary work. Synthesis modules need more Tier-3 application questions and project ideas. Adjust the balance accordingly -- do not produce the same structure for a foundational vocabulary module as for a capstone synthesis module.

8. **Spaced repetition dates must be specific.** "Review soon" is not a schedule. If the learner gives you today's date or context clues (e.g., "exam in 2 weeks"), calculate the exact dates. If no date information is available, provide intervals clearly labeled as Day+1, Day+4, Day+11, and Pre-exam.

9. **Flag content you inferred versus content the learner provided.** If the learner gave you slide headings and you elaborated definitions from your own domain knowledge, state this clearly at the top of the glossary: "Note: Definitions marked with * were inferred from topic names, not taken from your course materials. Verify these against your textbook or lecture notes."

10. **A Course Companion is a living document.** After delivering each module's companion, always close with an explicit invitation to add, correct, or extend. The learner's feedback after their next lecture should revise the companion, not be discarded. Suggest they annotate the companion during their next watch/class and return with additions.

---

## Edge Cases

### The learner provides only topic names with no lecture notes or course materials
This is the most common scenario and not a blocker -- it is a starting point. Use your domain knowledge to build a plausible companion based on how the topic is standardly taught, then prominently label every definition, concept explanation, and question with a disclaimer: "This content is based on standard coverage of [topic] and may not match your instructor's specific emphasis or terminology. Compare each item against your lecture notes and correct anything that differs." Prioritize the structural scaffold (glossary, questions, connection map) over specific factual claims. The learner's job is to fill in the gaps from their actual materials.

### The learner's course covers highly niche or proprietary content (e.g., an internal corporate training course)
The learner may be the only source of ground truth. In this case, work entirely from what they provide and do not infer from general domain knowledge -- their course's proprietary framework may contradict standard practice. Ask for a complete list of terms and concepts the course introduces, plus any definitions the course provides. Build the companion strictly from that material. For Tier-3 questions, use the learner's own organizational context as the application domain.

### The learner is far behind in the course and needs to cover multiple modules at once
Do not attempt to compress eight modules into one companion document. This produces shallow coverage and defeats the purpose of the companion structure. Instead: (1) Ask the learner how many days they have before their next assessment. (2) Calculate how many modules can be covered with the spaced repetition schedule intact. (3) Identify which modules are Foundation type and cover those first, even if it means skipping Application or Extension modules temporarily. (4) Produce a triage plan that names which modules are highest-yield for the assessment and which can be reviewed at lower depth.

### The learner is studying the same content in a second language (e.g., a native Spanish speaker taking a course taught in English)
Build the companion with definitions and explanations in the learner's native language, but preserve the English terminology as the primary term entry in the glossary. The test and the course operate in English, but understanding is the goal -- not language practice. Mark this clearly: "Definitions in Spanish for comprehension; English terms bolded for use in assessments." Do not mix languages mid-sentence except to provide the native-language gloss of a technical term.

### A concept in the current module contradicts something the learner says they learned in a prior module
This is a high-value moment and should not be smoothed over. Contradictions arise for several reasons: the prior module introduced a simplified model that is now being complicated (common in science courses), the instructor's framing changed, or the learner has a misconception from the prior module. Explicitly name the contradiction, present both versions, and offer three possibilities: "(1) The course is deliberately moving from a simplified to a nuanced model -- this is normal and both versions are 'true' at different levels of analysis. (2) Your recollection of the prior module may have a gap -- here is what the prior concept most likely said. (3) There may be a genuine inconsistency in the course -- flag it for your instructor." Do not silently overwrite the prior concept.

### The learner has a learning difference (e.g., states they have ADHD, dyslexia, or processing differences)
Adjust the companion format immediately without requiring the learner to explain or justify. For ADHD: shorten text blocks, use more bullet points and visual separators, break the self-assessment into smaller micro-checks rather than a long checklist, and provide a "just the essentials" summary box at the top of each section. For dyslexia: avoid dense tables where possible, use numbered lists with extra white space, and consider offering the definitions in a call-and-response format rather than a table. For processing differences generally: simplify sentence structures in definitions without dumbing down the content, and offer to re-explain any concept in three different ways (formal definition, analogy, worked example) so the learner can choose the representation that works for them.

### The course uses a non-standard or contested framework
Some courses -- particularly in social sciences, management, or emerging fields -- teach frameworks that experts outside the course would challenge. The companion's job is not to adjudicate academic debates; it is to help the learner succeed in the course. Build the companion using the course's framework faithfully. However, if you have domain knowledge that a specific claim in the course is actively contested or has been significantly updated by more recent research, add a brief, neutral note: "Note: This model is standard in introductory coursework. Current research has extended/challenged it in the following ways -- [one sentence summary]. Your course exam will likely expect the introductory model." This protects the learner from both confusion and from carrying an outdated model into professional practice.

---

## Example

**Input:** "I'm taking an undergraduate Behavioral Economics course. I just finished Module 4 on cognitive biases and heuristics -- we covered anchoring, availability heuristic, representativeness heuristic, the planning fallacy, and loss aversion. I took some notes but they're pretty scattered. I'm studying for a midterm in 10 days and I want to really understand this stuff, not just memorize definitions. My prof tends to give scenario-based application questions."

---

**Output:**

## Course Companion: Behavioral Economics -- Module 4

**Subject Area:** Behavioral Economics
**Course Platform/Setting:** Undergraduate university course
**Module Covered:** Module 4 -- Cognitive Biases and Heuristics
**Module Type:** Foundation (introducing core bias framework used throughout the course)
**Learner Level:** Intermediate (second or third year undergraduate, some economics background assumed)
**Companion Purpose:** Exam preparation with emphasis on scenario-based application
**Source Material Used:** Learner's scattered notes; definitions and examples supplemented from standard behavioral economics curriculum -- items marked with * should be verified against your lecture slides
**Date Created:** [Date]
**Midterm:** 10 days from today -- Review schedule calibrated to this deadline

---

### Conceptual Spine

> This course answers: Why do people systematically make decisions that contradict the predictions of classical economic rationality -- and what are the predictable patterns of those deviations?
> This module's contribution: These five biases and heuristics are the core toolkit for identifying *how* and *when* human judgment departs from the rational actor model, and they serve as building blocks for every pricing, policy, and organizational intervention covered in later modules.

---

### Key Terms Glossary

| Term | Precise Definition | Distinguished From | Examples | Common Misconception |
|------|-------------------|-------------------|---------|---------------------|
| **Anchoring** | The tendency to rely disproportionately on the first piece of numerical information encountered (the "anchor") when making subsequent estimates or decisions, even when the anchor is arbitrary or irrelevant | Distinguished from *framing*: framing changes how a choice is presented (gain vs. loss language); anchoring specifically involves a numeric reference point that pulls estimates toward it | Canonical: Tversky & Kahneman's wheel-of-fortune study -- participants spun a wheel landing on 10 or 65, then guessed the % of African nations in the UN; high-anchor group guessed far higher. Novel: A landlord lists an apartment at $2,400/mo knowing the market rate is $1,900; prospective tenants negotiate down to $2,100, perceiving a deal. | Students think anchoring only works when people believe the anchor is relevant. It works even when people *know* the anchor is arbitrary -- that's what makes it a bias, not just reasonable inference. |
| **Availability Heuristic** | A mental shortcut that estimates the probability or frequency of an event based on how easily examples come to mind -- how *available* they are in memory | Distinguished from *representativeness*: availability is about memory retrieval ease; representativeness is about resemblance to a prototype. Both are heuristics but operate through different mechanisms | Canonical: People overestimate death by shark attack and underestimate death by falling because shark attacks get dramatic news coverage. Novel: After seeing a colleague fired for missing a deadline, a project manager vastly overestimates how often missed deadlines lead to termination | Students confuse "available" with "recent." Availability is about vividness and ease of recall, not just recency -- a memorable event from five years ago can dominate over a relevant but forgettable event from last week. |
| **Representativeness Heuristic** | Judging the probability that something belongs to a category by how closely it resembles the prototypical member of that category, while neglecting base rates and statistical reasoning | Distinguished from *availability*: representativeness uses resemblance to a mental prototype; availability uses memory ease. Both cause probability estimation errors but through different routes. | Canonical: The "Linda problem" (Tversky & Kahneman) -- Linda is described as activist-minded; people rate "bank teller and feminist activist" as more probable than "bank teller," violating the conjunction rule. Novel: A recruiter assumes a candidate who speaks confidently and has a polished resume will be a high performer, ignoring base rates on resume-to-performance prediction. | Students think representativeness means stereotyping in the social sense. It is a general cognitive mechanism that applies to objects, events, and numerical sequences -- not just to social judgments about people. |
| **Planning Fallacy** | The systematic tendency to underestimate the time, cost, and risks of future actions while overestimating the benefits -- even when the planner knows similar past projects ran over budget and schedule | Distinguished from *optimism bias*: optimism bias is the broad tendency to expect better outcomes than evidence warrants; the planning fallacy is specifically about project/task time and cost estimation, and it persists even with explicit knowledge of past failures | Canonical: The Sydney Opera House, estimated at $7 million and 4 years, cost $102 million and took 14 years. Novel: A student estimates writing a 10-page paper will take 3 hours based on what they wish were true, having previously spent 7+ hours on every similar paper | Students think knowing about the planning fallacy cures it. It does not -- even experts who know the research underestimate project timelines for their own projects. The corrective is the *reference class forecasting* technique (using outside-view data), not awareness alone. |
| **Loss Aversion** | The asymmetric weighting of losses and gains such that losses feel approximately 2--2.5x more painful than equivalent gains feel pleasurable -- a core component of Prospect Theory (Kahneman & Tversky, 1979) | Distinguished from *risk aversion*: risk aversion means preferring a certain outcome to a gamble with equal expected value; loss aversion is specifically about the asymmetric psychological weight of losses vs. gains. A person can be loss-averse without being generally risk-averse. | Canonical: People refuse a 50/50 bet to win $120 or lose $100, even though expected value is positive (+$10). Novel: A homeowner refuses to sell their house for what the market will bear because they mentally anchor to what they paid -- a loss relative to their reference point feels unacceptable even when the sale price is objectively reasonable | Students think loss aversion means people always avoid any possible loss. People accept losses when the reference point shifts or when the loss is framed as a cost rather than a loss. Framing and reference points modulate loss aversion. |

---

### Core Concepts

#### Concept 1: The Heuristic-Bias Relationship
**What it is:** Heuristics are mental shortcuts that allow fast, low-effort judgment. They are not irrational -- in most environments, they produce good-enough decisions quickly. Biases are the predictable errors that emerge when heuristics are applied in environments where their assumptions break down.
**Why it matters:** This course is not arguing that humans are stupid or irrational. It is arguing that human judgment is adapted to certain conditions and produces systematic errors in other conditions. This framing -- heuristics as adaptive, biases as predictable error patterns -- is the conceptual foundation for every intervention discussed later in the course.
**The mechanism:**
1. A judgment is required under uncertainty (What is the probability of X? How long will Y take?)
2. Computing the true answer is cognitively expensive or impossible
3. The mind substitutes an easier question (How easily can I recall examples of X? Does Y look like the prototype of a long project?)
4. The answer to the easier question drives the response
5. The easier question is systematically correlated with the true answer in most natural environments -- but not all
**Counterintuitive element:** Eliminating heuristics would not improve human judgment overall -- it would collapse decision-making speed. The goal of behavioral economics is not to make people reason like statisticians for every decision; it is to redesign environments (choice architecture) so that heuristics lead to better outcomes.

#### Concept 2: Prospect Theory and the Reference Point
**What it is:** Prospect Theory (Kahneman & Tversky, 1979) replaces the classical utility function with a value function that is (a) defined relative to a reference point rather than absolute wealth, (b) concave in the gains domain (diminishing sensitivity to gains), (c) convex in the losses domain (diminishing sensitivity to losses), and (d) steeper for losses than gains (loss aversion).
**Why it matters:** Loss aversion cannot be understood without the reference point concept. The same outcome can be a gain or a loss depending on where the person's reference point sits. This is why framing effects are so powerful -- changing what counts as the reference point changes behavior.
**The mechanism:**
1. A person establishes a reference point (current state, expected state, aspiration level, or social comparison point)
2. Outcomes are evaluated as gains or losses relative to that reference point -- not as absolute outcomes
3. The loss side of the value function is steeper by a factor of approximately 2.0-2.5 (empirical range across many studies)
4. This asymmetry produces endowment effects, status quo bias, and reluctance to trade even when trades are value-positive
**Counterintuitive element:** The reference point is not fixed -- it can be manipulated. Sellers, negotiators, and policy designers routinely engineer reference points to change perceived gains and losses. When you pay $4,200 for a car add-on after agreeing to a $42,000 base price, the add-on feels trivial not because it is trivial but because your reference point shifted to $42,000.

#### Concept 3: The Inside View vs. Outside View (Planning Fallacy Corrective)
**What it is:** The inside view uses case-specific information -- your plan, your team, your intention -- to estimate project outcomes. The outside view (reference class forecasting) uses the statistical distribution of outcomes for a reference class of similar past projects, ignoring the specific case's details.
**Why it matters:** The planning fallacy persists because people default to the inside view. The corrective -- deliberately asking "What is the base rate of completion time for projects like this one?" -- is specific and teachable. Your professor is likely to ask you to apply this corrective in scenario questions.
**The mechanism:**
1. Identify the reference class (what category does this project belong to?)
2. Find the statistical distribution of outcomes for that class (average completion time, cost overrun rate, success rate)
3. Anchor your estimate on the distribution's median or mean, not on your inside-view plan
4. Adjust only modestly from the base rate for features that are genuinely unique to your case
**Counterintuitive element:** The inside view feels more accurate because it is specific and detailed. More detail produces more confidence without producing more accuracy -- a phenomenon called the *illusion of explanatory depth*. Counterintuitively, ignoring the specifics of your case (the outside view) usually produces better calibration.

---

### Module Connections

**Builds on:**
- Module 1 (Rational Actor Model) -- The rational actor assumes people maximize expected utility using accurate probability assessments. Every bias in this module is defined precisely as a deviation from that baseline. If you are unclear on expected utility theory, the biases will seem like random quirks rather than systematic deviations from a specific model.
- Module 2 (Dual Process Theory, System 1 / System 2) -- Heuristics operate in System 1 (fast, automatic, associative). Understanding *why* heuristics are the default requires understanding System 1's architecture.

**Prepares for:**
- Module 5 (Choice Architecture and Nudge Theory) -- Every nudge intervention is designed around a specific bias. Default-setting as a nudge works because of status quo bias (a cousin of loss aversion). Understanding the biases in Module 4 is prerequisite to understanding why nudges work.
- Module 7 (Pricing and Consumer Behavior) -- Anchoring, loss aversion, and reference point manipulation are the mechanisms behind almost every behavioral pricing strategy: charm pricing, decoy pricing, and subscription framing.

**Cross-domain analogy:**
- The heuristic-bias framework mirrors the concept of *optical illusions* in visual perception. Your visual system uses shortcuts that produce reliable perception in normal environments. In unusual conditions (the Müller-Lyer illusion), the same shortcuts produce systematic errors -- and the error persists even after you know about it. Knowing the lines are equal length does not make them look equal. Similarly, knowing about anchoring does not eliminate its effect on your judgments.

---

### Review Questions

#### Tier 1 -- Recall
1. Define the availability heuristic in one sentence and name one factor (other than recency) that increases the availability of a memory.
2. What is the approximate loss aversion coefficient (ratio of loss weight to gain weight) found across empirical studies?
3. What are the two defining features that distinguish the planning fallacy from general optimism bias?

#### Tier 2 -- Conceptual Understanding
1. Explain why a person can exhibit loss aversion in one choice and not another, depending on how the reference point is set. Give a concrete example where the same outcome is framed as both a gain and a loss.
2. Why does the representativeness heuristic cause people to commit the conjunction fallacy? Walk through the mechanism, not just the conclusion.
3. A policy analyst argues: "If we just educate people about anchoring, they will stop being anchored in salary negotiations." Evaluate this claim using what you know about the limits of debiasing.

#### Tier 3 -- Application and Transfer
1. You are the behavioral economics consultant for a gym chain. The gym wants to increase member retention using principles from Module 4. Identify two specific biases from this module, explain how each bias affects gym members' behavior, and design one intervention based on each bias that the gym could implement. Be specific about the mechanism.
2. A software project manager tells you: "We estimated 6 months for this project. We know about the planning fallacy, so we added a 30% buffer. That gives us 7.8 months. We're covered." Identify the flaw in this reasoning and explain what they should have done instead using the outside view / reference class forecasting approach.

**Answer Key:**
*(Attempt every question before reading this)*

- **T1-1:** The availability heuristic estimates event probability or frequency by how easily examples come to mind. Vividness/emotional salience increases availability independent of recency -- a traumatic event from years ago may be more available than a mundane event from yesterday.
- **T1-2:** Approximately 2.0-2.5x -- losses are weighted roughly twice as heavily as equivalent gains.
- **T1-3:** (1) The planning fallacy is specifically about time and cost estimation for projects/tasks, not outcomes generally; (2) it persists even when the planner has explicit knowledge of past overruns on similar projects -- general optimism bias does not require that specific condition.
- **T2-1:** Reference points are not fixed at absolute wealth. They are set by the current state, expectations, or social comparisons. Example: If you expected a $5,000 bonus and receive $3,000, you experience a loss of $2,000 even though your absolute wealth increased. The same $3,000 received by someone who expected nothing is a pure gain. Same outcome; opposite valence. Loss aversion predicts the first person is more unhappy about their $3,000 than the second person is happy about theirs.
- **T2-2:** The conjunction fallacy occurs because the representativeness heuristic evaluates probability by resemblance to a prototype rather than by statistical logic. "Bank teller and feminist activist" more closely resembles the description of Linda than "bank teller" alone -- so representativeness scores it higher. But statistically, the conjunction of two events can never exceed the probability of either alone (P(A∩B) ≤ P(A)). The heuristic substitutes "resembles the description" for "is statistically probable" -- and the answers diverge precisely because the description was crafted to make representativeness misleading.
- **T2-3:** This claim fails for two reasons. First, laboratory debiasing studies show that awareness alone reduces anchoring effects by a small amount at best -- typically 10-20% -- and does not eliminate them. The bias is driven by automatic System 1 processing; awareness is a System 2 intervention that cannot fully override System 1 under time pressure and real stakes. Second, in salary negotiations, the anchor is set by the other party, not by the person who knows about anchoring. The negotiator who sets the first anchor still benefits even against an informed counterpart. The real corrective for anchoring in negotiations is to set your own anchor first, not to educate people about the bias.
- **T3-1 (Model answer -- multiple valid designs exist):** Loss aversion: Gym members stop attending after a few weeks but maintain membership because canceling feels like admitting failure (a loss relative to their self-image reference point). Intervention: Reframe the cancellation decision as "pausing" rather than "quitting," which lowers the perceived loss at cancellation -- paradoxically keeping engaged members who would otherwise churn due to guilt-based avoidance. Availability heuristic: Members overestimate the availability of future motivation because they encode their best gym days most vividly. Intervention: Send members a monthly "progress snapshot" featuring their actual attendance data, not just their best sessions, to recalibrate their availability-based self-assessment and prompt realistic recommitment.
- **T3-2:** The flaw: Adding a buffer to an inside-view estimate preserves the inside view's errors. A 30% buffer applied to an optimistically biased estimate is still biased. The correct approach is reference class forecasting: (1) Identify the reference class -- software projects of similar scope, team size, and technology stack. (2) Find the statistical distribution of actual delivery times for that class (published data suggest software projects overrun by 40-200% on average). (3) Anchor the estimate on the reference class median delivery time, not the inside-view plan. (4) Adjust from the median only for features that are genuinely, verifiably different from the reference class. The manager's 30% buffer may still be a massive underestimate if the reference class median is 2x the inside-view estimate.

---

### Practice Exercise

**Exercise (20 min):** Open any news article about a business decision, policy proposal, or project announcement made in the last 6 months. Identify at least two biases from this module that may have affected the decision-makers. For each bias: (a) name the bias, (b) identify the specific evidence in the article that suggests it is operating, (c) describe what a rational actor model would have predicted instead, and (d) suggest one concrete change to the decision process that could have counteracted the bias.

*What to check:* Your analysis should show that you are distinguishing between biases (not using "cognitive bias" as a vague label), that you are explaining the mechanism rather than just naming the bias, and that your intervention targets the mechanism directly rather than just "being more careful."

**Extension Exercise (30 min, optional):** Design a 5-question scenario-based quiz for this module that your classmates could take. Write a Tier-3 question for each of the five biases, including a brief model answer. This exercise forces you to understand each bias well enough to construct a scenario where it applies -- a higher-order test of understanding than answering questions.

---

### Project Ideas

| Project Type | Title | Description | Time Estimate | Concepts Applied |
|-------------|-------|-------------|---------------|-----------------|
| Analytical | Bias Audit of a Real Decision | Select a historical business failure or public policy misstep (e.g., a product launch that overran budget and missed market). Write a 600-word analysis identifying which biases contributed, using specific evidence from public accounts. | 2-3 hours | Planning Fallacy, Availability, Representativeness |
| Creative | Choice Architecture Redesign | Select one process you encounter regularly (a checkout flow, a form you fill out, a meeting format) and redesign it to reduce the effect of two specific biases. Produce a before/after comparison with explanation. | 2-3 hours | Anchoring, Loss Aversion |
| Explanatory | "Bias Explainer" for a Non-Expert Audience | Write a 500-word plain-language article (suitable for a general blog or internal company newsletter) explaining loss aversion and the planning fallacy to a reader with no economics background. No jargon; use two original examples not from the course. | 1.5-2 hours | Loss Aversion, Planning Fallacy |
| Applied | Personal Bias Inventory | Over the next 5 days, keep a decision journal. Each day, record two decisions you made and analyze each for evidence of any bias from this module. At the end, write a one-page reflection on which biases appear most in your own decision-making and what environmental changes (not willpower) could reduce them. | 30 min/day + 1 hour reflection | All five biases |

---

### Self-Assessment Checklist

For each concept below, rate yourself: 🟢 Can explain and apply without notes | 🟡 Understand but need notes | 🔴 Still unclear

| Concept | Rating | If Yellow: Practice recommendation | If Red: Re-study action |
|---------|--------|-----------------------------------|------------------------|
| Anchoring mechanism and limits of debiasing | [ ] | Write out the mechanism without notes, then check | Re-read the wheel-of-fortune example and ask me to walk through it with a new example |
| Availability vs. representativeness distinction | [ ] | Generate one original example of each with no overlap | Ask me to contrast these two through three different scenario pairs |
| Conjunction fallacy and why representativeness causes it | [ ] | Explain the Linda problem step by step without notes | Ask me for a worked derivation of why P(A∩B) ≤ P(A) matters here |
| Planning fallacy vs. optimism bias + the outside view corrective | [ ] | Walk through the reference class forecasting steps on a personal project | Ask me to apply the outside view to a project you are currently working on |
| Loss aversion coefficient + reference point flexibility | [ ] | Write three sentences: (1) what the coefficient is, (2) what a reference point is, (3) how the same outcome can be both a gain and a loss | Ask me to re-explain Prospect Theory using a purchasing decision scenario |

**Demonstrative Challenges:**
- Without looking at any notes, draw a labeled sketch of the Prospect Theory value function. Label: reference point, gains region, losses region, where the curve is concave vs. convex, and indicate which side is steeper. If you cannot draw and label all five elements, mark loss aversion and reference points as Red.
- Without notes, explain to an imaginary friend the difference between the availability heuristic and the representativeness heuristic using two examples they have never heard before (no Linda, no sharks). If you need your notes to come up with the examples, mark both as Yellow.

---

### Spaced Repetition Schedule

*(Midterm is in 10 days -- schedule calibrated accordingly)*

| Review Session | Timing | What to Review | Method |
|---------------|--------|----------------|--------|
| Review 1 | Tomorrow (Day 1) | All Red concepts from self-assessment + all Tier 1 questions | Re-read definitions for Red concepts; answer all Tier 1 questions without notes; check answers |
| Review 2 | Day 4 | Yellow concepts + all Tier 2 questions | Answer Tier 2 questions without notes; write out reasoning chains; compare to answer key |
| Review 3 | Day 7 | Full module -- all concepts + Tier 3 scenarios | Complete Tier 3 application questions under mild time pressure (15 min per question); focus on scenario transfer |
| Review 4 | Day 9 (day before midterm) | Full glossary + demonstrative challenges | Timed self-quiz using only the Key Terms table covered; redo demonstrative challenges |

---

### Next Steps
- **Next module companion:** Share your Module 5 materials (choice architecture and nudge theory) whenever you are ready -- I will build that companion and explicitly cross-reference the five biases from Module 4 in every nudge mechanism.
- **Suggested follow-up skill:** Use `exam-practice` to generate a timed, scored scenario-based quiz in your professor's exact style if you can share a past exam or assignment prompt.
- **Red concept support:** If any concept landed as Red, tell me which one and I will re-explain it using (1) a pure analogy with no technical language, (2) a step-by-step worked example, or (3) a Socratic dialogue -- your choice of format.
