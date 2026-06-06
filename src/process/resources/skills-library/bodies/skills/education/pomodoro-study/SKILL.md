---
name: pomodoro-study
description: |
  Creates structured Pomodoro study sessions with topic breakdowns, timed work intervals, breaks, and review periods for learners. Uses the Pomodoro technique to produce a ready-to-follow session plan -- not an explanation of what the Pomodoro technique is.
  Use when a learner asks to use the Pomodoro technique for studying, structure a focused study session, or create a timed study plan with breaks.
  Do NOT use for general study planning over weeks (use `study-plan`), for spaced repetition scheduling (use `spaced-repetition`), or for time management beyond study sessions (not an education skill).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "study-skills step-by-step guide beginner-friendly"
  category: "education"
  subcategory: "self-learning"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Pomodoro Study

## When to Use

Use this skill when the learner wants a concrete, ready-to-follow session plan -- not an explanation of what the Pomodoro technique is or advice about study habits in general.

**Trigger scenarios:**
- A learner provides specific material (lecture notes, a textbook chapter, a list of concepts) and asks for a Pomodoro session to study it now or later today
- A student has a fixed window of time (e.g., "I have 2 hours before my exam") and needs a structured, timed plan for that window
- A learner has already studied material once and wants a Pomodoro session focused on review and self-testing -- not first-pass reading
- A user asks to "break down" a topic into focused work intervals with assigned tasks per interval
- A learner describes a specific exam, assignment, or deadline and wants a session plan to prepare for it using timed focus blocks
- A user explicitly mentions Pomodoro, timed study intervals, focus blocks, or asks to "structure my study session"
- A student needs to process a large chunk of material in a single sitting and wants to avoid burnout or wandering attention

**Do NOT use when:**
- The user wants a multi-day or multi-week study schedule across multiple subjects -- use `study-plan` instead, which handles spaced sessions across a calendar
- The user wants to know when to review material based on forgetting curves -- use `spaced-repetition`, which schedules reviews over days and weeks
- The user is asking about time management for work tasks, projects, or productivity outside study -- this skill is scoped to learning sessions only
- The user wants practice questions, mock tests, or exam-format problems generated -- use `exam-practice`, which produces the questions themselves
- The user is an educator designing a lesson, course, or curriculum -- check teaching subcategory skills
- The user wants flashcards created as a standalone deliverable -- use `flashcard-generation`
- The user wants a general explanation of how the Pomodoro technique works -- this skill produces session plans, not tutorials

---

## Process

### 1. Collect the five essential inputs before building anything

Do not begin building the session plan without these. If any are missing, ask for them before proceeding.

- **Subject and specific topic:** Not "biology" but "cell membrane transport: active vs. passive, osmosis, facilitated diffusion, sodium-potassium pump." The more specific, the more useful the task assignments.
- **Source material:** What does the learner have in front of them? Lecture slides, a textbook chapter, handwritten notes, a video transcript, a problem set? Name the exact material so tasks can reference it directly (e.g., "Read slides 12-24" rather than "Read about the topic").
- **Current knowledge level:** First encounter (never seen this before), partial familiarity (attended lecture but hasn't reviewed), or review mode (studied before, consolidating). This determines the cognitive load per Pomodoro and the task types to assign.
- **Purpose of this session:** Four distinct purposes require different task structures -- (a) first-pass comprehension of new material, (b) memorization of terms and definitions, (c) application through practice problems, (d) integration with previously learned concepts. Mixing purposes in a single session is fine but must be deliberate.
- **Time available:** Total minutes available. This determines how many Pomodoros fit, whether a full session is feasible, and whether to use standard 25/5 intervals or an adjusted protocol.

If the learner provides all five spontaneously, skip directly to Step 2.

---

### 2. Determine the session architecture

Calculate how many Pomodoros fit in the available time and select the appropriate interval variant.

**Time mapping (standard 25/5 protocol):**
- 30 minutes: 1 Pomodoro only -- no break needed, but end with a 5-minute self-check
- 60 minutes: 2 Pomodoros + 1 short break (5 min) -- effective for single-concept deep dives
- 90 minutes: 3 Pomodoros + 2 short breaks -- the minimum for a complete study arc (introduce, process, review)
- 120 minutes: 4 Pomodoros + 3 short breaks -- the standard full session; ends with 1 long break
- 150 minutes: 4 Pomodoros + 1 long break (15 min) + 2 more Pomodoros -- split session with mid-point reset
- 180 minutes: 6 Pomodoros across two sets of 4 -- plan a genuine 20-30 minute long break between sets

**Interval variants by learner profile (select before building the table):**

| Profile | Work Interval | Short Break | Long Break After |
|---------|--------------|-------------|-----------------|
| Standard adult learner | 25 min | 5 min | 4 Pomodoros |
| Learner building focus stamina | 15 min | 5 min | 4 Pomodoros |
| Deep-work adapted learner | 50 min | 10 min | 2-3 Pomodoros |
| ADHD or high-distractibility | 15-20 min | 5 min active | 3 Pomodoros |
| Pre-exam last review (high urgency) | 25 min | 3 min | 4 Pomodoros |

Identify which profile fits the learner based on what they've told you. If uncertain, default to standard 25/5.

---

### 3. Assign specific tasks to each Pomodoro

This is the core of the skill -- vague task assignments produce vague results. Every Pomodoro must have a task that is:
- **Bounded:** The learner can know when it is done (finish reading pages 34-47, not "read chapter 3")
- **Cognitively matched:** First-pass Pomodoros = reading and annotating. Second-pass = summarizing or concept mapping. Third-pass = self-testing or practice problems. Fourth (review) = retrieval practice with notes closed.
- **Sequenced deliberately:** Follow the read → process → retrieve arc within a session. Never assign retrieval in Pomodoro 1 if the learner hasn't encountered the material yet.
- **Realistic in scope:** A 25-minute Pomodoro can cover approximately 8-12 pages of dense academic text with annotation, 15-20 pages of lighter reading, 10-15 vocabulary items with active recall, or 5-8 multi-step practice problems. Do not over-assign.

**Task type taxonomy (use these labels in the session table):**
- **Read & Annotate:** First encounter with new material; mark key terms, write margin questions
- **Summarize:** Close the source and write a 5-8 sentence summary from memory; then check
- **Concept Map:** Draw relationships between ideas on paper -- no looking up, then verify
- **Term Drill:** Cover definitions, recall them aloud or in writing, check accuracy
- **Practice Problems:** Work problems from problem sets, past exams, or textbook exercises
- **Teach-Back:** Explain a concept aloud as if to someone who knows nothing -- the "Feynman technique" compressed into one Pomodoro
- **Gap Fill:** Review completed summary/concept map, identify what's missing, re-read only those gaps
- **Full Retrieval Test:** Open a blank page, write everything you remember on the topic -- then check

---

### 4. Extract and embed the actual content into the plan

Do not leave the plan abstract. Populate it with the learner's real material:
- List the key concepts, terms, formulas, or processes from the source material explicitly in the plan so the learner doesn't have to re-derive them
- Group related concepts so each Pomodoro covers a coherent sub-topic rather than a random slice of pages
- Identify which concepts are high-complexity (require deeper processing, more time) vs. definitional (can be processed faster)
- Flag any prerequisite knowledge the learner needs before a Pomodoro makes sense -- if they need to know X before Y, order the Pomodoros accordingly
- Include 2-3 targeted self-check questions per Pomodoro block so the learner has an immediate comprehension check at the end of each interval -- not just at session end

---

### 5. Build the interruption and distraction management protocol

Every session plan must include an explicit strategy for handling interruptions because interruptions are the primary failure mode of the Pomodoro technique.

- Include an "Interruption Sheet" instruction: when a stray thought, task, or distraction arises mid-Pomodoro, the learner writes it down on a separate sheet and returns immediately to studying -- it is not ignored or acted on
- Specify what to do if an unavoidable interruption occurs (phone call, emergency): if the Pomodoro is broken before 20 minutes have elapsed, restart it from scratch once the interruption is resolved; if it was broken after 20 minutes, count it as complete but make a note
- Recommend a physical timer (kitchen timer, dedicated app) rather than a phone timer if the learner has mentioned phone-related distraction -- phone-as-timer creates an on-ramp for social media during breaks
- Specify what counts as a valid break activity: standing, stretching, walking, hydrating, looking out a window. What does not count: checking messages, reading, watching videos, scrolling, or any other information input

---

### 6. Write the self-check and session reflection blocks

These are not optional add-ons -- they are the mechanism that converts passive study time into verifiable learning.

**Per-Pomodoro micro-check (embed at the end of each Pomodoro in the table):**
- One specific recall question the learner can answer without notes
- A binary pass/fail: if they cannot answer it, the next Pomodoro should revisit before moving forward

**End-of-session self-check (3-5 questions, retrieval-style):**
- Questions must test application or explanation, not just definition recall
- At least one question should require the learner to connect two concepts from different Pomodoros
- At least one question should ask the learner to generate a new example -- not repeat an example from the source material

**Session reflection log (fill in after the session):**
- Pomodoros completed vs. planned
- Interruption count
- Hardest concept encountered
- One thing that would make the next session more effective
- Confidence level on the material (1-5 scale) -- this feeds into when to schedule the next review

---

### 7. Connect to next steps and spaced review

Every session plan must end with a clear forward-link so the learner knows exactly what to do after the session is over.

- **Spaced review timing:** For material studied for the first time in this session, recommend review at 24 hours, 3-4 days, and 7-10 days. For material being reviewed for the second time, extend intervals to 7 days and 21 days. Do not use generic "review later" language -- give specific day counts.
- **Complementary technique recommendation:** Based on the material type, recommend one follow-up technique. Term-heavy material → `flashcard-generation`. Process or procedure content → practice problems. Conceptual material → teach-back sessions or concept mapping. Multi-topic integration → use `study-plan` to sequence sessions.
- **Explicit next Pomodoro session topic:** Tell the learner what the next session should cover based on what was not completed or what the micro-checks revealed as weak.

---

### 8. Final quality check before delivering

Before outputting the plan, verify:
- Every Pomodoro has a specific, bounded task (no "study X" -- must say what action to take)
- The total time adds up correctly (Pomodoros + breaks = learner's available time)
- The sequence follows a logical cognitive arc (input before processing, processing before retrieval)
- The self-check questions are answerable from the material provided -- not trivia or too advanced
- No Pomodoro is overloaded (respect the 8-12 page, 10-15 term, or 5-8 problem limits)
- The key concepts section contains the learner's actual terms -- not generic placeholders

---

## Output Format

Deliver the session plan in this exact structure. Every field must be filled with the learner's real material -- no brackets or placeholders in the final output.

```
## Pomodoro Study Session: [Subject] -- [Specific Topic]

**Subject:** [Subject name]
**Specific Topic:** [Exact topic being studied]
**Session Date:** [Today's date or intended date]
**Total Available Time:** [X minutes]
**Pomodoros Planned:** [Number]
**Interval Protocol:** [e.g., Standard 25/5 | 15/5 | 50/10]
**Session Purpose:** [First-pass comprehension | Memorization | Practice | Review]
**Source Material:** [Exact material -- lecture slides pp. X-Y, textbook chapter Z, etc.]

---

### Key Concepts This Session Covers

[List the actual concepts, terms, formulas, or processes from the learner's material. 
Grouped by sub-topic where relevant. 3-15 items depending on session scope.]

- **[Term or Concept]:** [One-sentence definition or description]
- **[Term or Concept]:** [One-sentence definition or description]
(continue for all key items)

---

### Session Schedule

| Block | Duration | Task Type | Specific Task | Micro-Check Question |
|-------|----------|-----------|---------------|---------------------|
| Pomodoro 1 | 25 min | [Task Type] | [Specific bounded task using learner's actual material] | [One recall question answerable from this Pomodoro's material] |
| Break 1 | 5 min | Active rest | Stand, stretch, hydrate -- no screens | -- |
| Pomodoro 2 | 25 min | [Task Type] | [Specific bounded task] | [Micro-check question] |
| Break 2 | 5 min | Active rest | Stand, stretch, hydrate -- no screens | -- |
| Pomodoro 3 | 25 min | [Task Type] | [Specific bounded task] | [Micro-check question] |
| Break 3 | 5 min | Active rest | Stand, stretch, hydrate -- no screens | -- |
| Pomodoro 4 | 25 min | [Task Type] | [Specific bounded task -- always retrieval-focused] | [Micro-check question] |
| Long Break | 15-30 min | Full rest | Walk, eat, rest -- genuinely step away | -- |

*(Add or remove rows based on the number of Pomodoros calculated in Step 2)*

---

### Interruption Management

**Interruption Sheet:** Keep a blank piece of paper nearby. If a stray thought, task, or 
distraction surfaces mid-Pomodoro, write it here and return immediately to studying.

| # | Interruption / Stray Thought | Handle During: |
|---|------------------------------|---------------|
| 1 | (write here as they come up) | Break / After session |
| 2 | | |

**If the Pomodoro is broken involuntarily:**
- Broken before 20 minutes: restart the Pomodoro from zero once resolved
- Broken after 20 minutes: count as complete, note the interruption above

---

### End-of-Session Self-Check

Answer these questions with your notes closed. If you cannot answer a question, 
mark it as a gap and schedule targeted review for it in your next session.

1. [Application or explanation question requiring synthesis of Pomodoros 1-2 content]
   - [ ] Can answer without notes -- [ ] Cannot answer -- needs review

2. [Question requiring connection between two concepts from different Pomodoros]
   - [ ] Can answer without notes -- [ ] Cannot answer -- needs review

3. [Question asking learner to generate a new example not in the source material]
   - [ ] Can answer without notes -- [ ] Cannot answer -- needs review

4. [Question testing the most complex or abstract concept in the session]
   - [ ] Can answer without notes -- [ ] Cannot answer -- needs review

5. [Explain-it question: "Explain [core concept] as if to someone who has never heard of it."]
   - [ ] Can answer without notes -- [ ] Cannot answer -- needs review

---

### Session Reflection Log

*(Fill in after the session)*

- Pomodoros completed: ___/[Planned]
- Total interruptions: ___
- Micro-check fails (topics to revisit): ___________________________
- Hardest concept this session: ___________________________
- Confidence level on material (1 = very shaky, 5 = could teach it): ___/5
- One change for next session: ___________________________

---

### Next Steps

**Spaced Review Schedule:**
- [If first encounter] Review again in: 1 day ([date]), 3-4 days ([date]), 7-10 days ([date])
- [If second encounter] Review again in: 7 days ([date]), 21 days ([date])
- [If micro-checks revealed gaps] Target review in: 24 hours -- focus on [specific concepts]

**Next Pomodoro Session Should Cover:**
[Specific topic, based on what was not completed or what micro-checks flagged as weak]

**Recommended Complementary Technique:**
[One specific technique with skill name, e.g., "Create active-recall flashcards for the 
key terms using `flashcard-generation`" or "Generate practice problems for the 
calculation steps using `exam-practice`"]
```

---

## Rules

1. **Never deliver a plan without source material.** If the learner provides a subject but no actual content (notes, chapter, concept list), ask for the material before proceeding. A Pomodoro plan built around vague topics ("study chemistry") produces vague tasks that the learner cannot follow.

2. **Every Pomodoro must have a specific, bounded task.** "Study passive transport" fails this rule. "Read slides 14-22 on passive transport and write margin annotations on each mechanism" passes. The task must specify the action verb, the material, and the scope.

3. **Respect cognitive sequencing: input before processing, processing before retrieval.** Never assign retrieval (Teach-Back, Full Retrieval Test, Practice Problems from memory) in Pomodoro 1 if it is the learner's first encounter with the material. The sequence within a session must follow: read/receive → summarize/map → test/retrieve.

4. **Respect Pomodoro scope limits.** A 25-minute Pomodoro can realistically handle 8-12 pages of annotated reading, 10-15 vocabulary terms with active recall, or 5-8 multi-step practice problems. Do not assign 30 pages in one Pomodoro. Overloaded Pomodoros fail and demoralize learners.

5. **The session duration must add up precisely.** If the learner has 90 minutes, the total of all Pomodoros plus breaks must equal 90 minutes. Do not build a 120-minute session for someone with 90 minutes. Recalculate and cut a Pomodoro or adjust the long-break duration rather than let the plan exceed available time.

6. **Use the learner's actual terms, not generic substitutions.** If the learner's notes list "unconditioned stimulus," "acquisition," and "extinction," those exact terms appear in the key concepts section and the task descriptions. Generic placeholders like "Key Term A" invalidate the plan.

7. **Breaks are non-negotiable and must specify break activity.** Every plan must explicitly state that breaks are for physical movement, hydration, and rest -- not for screens, reading, or any information input. A break that is used for social media or news reading eliminates the cognitive restoration the break is designed to produce.

8. **Self-check questions must be answerable from the session's material.** Do not include questions that require knowledge outside the scope of the session's source material. Every self-check question must be directly traceable to something in the Key Concepts section or the source material.

9. **Spaced review dates must be specific.** "Review later" or "review soon" are not acceptable. Calculate actual dates (day 1, day 3-4, day 7-10 from the session date) and state them. If the session date is unknown, use relative offsets: "1 day after this session," "4 days after this session."

10. **If the learner has fewer than 30 minutes, do not build a multi-Pomodoro plan.** A single 25-minute Pomodoro with a 5-minute self-check is the minimum viable session. If the available time is under 25 minutes, recommend either postponing for a proper session or using the available time for a lighter technique (re-reading key points only) with an explicit note that this is not a full Pomodoro session.

11. **Do not mix incompatible purposes in a single Pomodoro.** Reading new material and doing retrieval practice in the same 25-minute block undermines both. Each Pomodoro has one task type. Purpose mixing is acceptable across a session (e.g., Pomodoros 1-2 for reading, Pomodoro 3 for summarizing, Pomodoro 4 for retrieval) -- never within a single Pomodoro.

12. **If the learner is unfamiliar with the Pomodoro technique, add a 3-sentence primer before the plan -- then move directly into the plan.** Do not turn the plan into a technique tutorial. The primer is: what the intervals are, why breaks are mandatory, and one rule (write down distractions rather than acting on them). Nothing more.

---

## Edge Cases

### The learner has vastly too much material for one session

A single Pomodoro session cannot cover an entire textbook chapter, a week of lectures, or a full course unit in one sitting. If the material clearly exceeds what 4-6 Pomodoros can reasonably process:
- Estimate the realistic scope per session based on the task type limits (8-12 annotated pages per Pomodoro, etc.)
- Split the material into numbered sessions (Session 1: pp. 1-30, Session 2: pp. 31-60)
- Build the plan for Session 1 only, and note explicitly what Sessions 2 and 3 will cover
- Recommend using `study-plan` for scheduling across multiple sessions over multiple days
- Do not attempt to compress everything into one session by overloading Pomodoros -- this is a common failure mode and produces a plan the learner will abandon

### The learner has ADHD, attention difficulties, or cannot sustain 25-minute focus

This is stated directly in many requests or implied by phrases like "I keep getting distracted" or "I can never finish a full Pomodoro."
- Switch to 15-minute work intervals with 5-minute active breaks (standing, walking, stretching -- not seated rest)
- Reduce the micro-check to a single sentence: "What was the most important thing in the last 15 minutes?"
- After 4 of these short Pomodoros (60 minutes total), recommend a genuine 15-20 minute break, not 5 minutes
- Note in the plan that intervals can increase by 5 minutes per week as focus stamina builds
- The interruption sheet is especially critical here -- provide explicit language: "Write it down, return in [X] minutes" rather than "handle it later"
- Do not suggest this learner is doing the technique wrong -- 15-minute intervals are a legitimate and research-supported adaptation

### The learner is studying in a second language (and the material is also in that language)

When a learner is both processing new academic content AND decoding in a non-native language, cognitive load is substantially higher than normal.
- Reduce task scope per Pomodoro by approximately 30-40% (6-8 pages instead of 10-12, 8-10 terms instead of 15)
- Add a dedicated vocabulary Pomodoro before comprehension tasks if the material is terminology-heavy
- Permit the learner to write their self-check answers in their native language -- comprehension is the goal, not language output accuracy
- Do not recommend Teach-Back (verbal explanation) as a task type unless the learner is specifically working on language production
- Flag this trade-off explicitly: "Because you are processing content in [language], this session covers less material per interval than it would in your native language -- this is appropriate, not a deficit."

### The learner wants to study a skill that requires active practice, not reading (e.g., math problem sets, coding, instrument practice)

Some study tasks are not reading-based, and the standard read/summarize/retrieve arc does not apply.
- For math or quantitative subjects: assign 4-6 worked problems per Pomodoro for first encounter, 6-8 problems per Pomodoro for practice
- For coding: assign one implementation task (write a function, debug a specific file, complete a specific exercise) per Pomodoro -- never open-ended "practice coding"
- For language writing tasks: assign one discrete output (write 150-word paragraph, complete 10-sentence grammar exercise) per Pomodoro
- The micro-check becomes: "Can you work a variant of the problem you just completed without looking at your worked example?"
- Breaks are especially important for hands-on tasks because the learner's hands and eyes have been engaged throughout -- stand and look at something distant

### The learner is in pre-exam crisis mode (exam in less than 3 hours)

The standard read → process → retrieve arc does not work when time is critically short. Prioritize ruthlessly.
- Use only two task types: Term Drill and Full Retrieval Test -- no new reading
- Assign Pomodoros strictly to high-yield topics: concepts most likely to appear on the exam, not all topics equally
- Use 3-minute breaks rather than 5-minute breaks -- the learner's urgency is real and 5-minute breaks feel wasteful under pressure, making it likely they will skip breaks entirely; shorter mandatory breaks maintain the rhythm without the resistance
- Remove the session reflection log and the spaced review schedule -- they are irrelevant in this context
- Add an explicit note: "This is a triage session. You are consolidating what you already know, not learning new material. Do not start new chapters -- depth over breadth in the time remaining."
- Limit to a maximum of 4 Pomodoros (100 minutes) -- studying more than this in the hours before an exam degrades performance due to fatigue and anxiety amplification

### The learner wants to use Pomodoro for a topic that requires extended, uninterrupted flow (e.g., writing a first draft, solving a complex proof, deep reading of dense philosophy)

Some cognitive tasks are genuinely harmed by the 25-minute interrupt cycle.
- Acknowledge this directly: "First-draft writing, long-form proofs, and dense interpretive reading benefit from longer uninterrupted blocks."
- Recommend the 50/10 extended protocol for these tasks (50 minutes work, 10 minutes break, long break after 2-3 cycles)
- If the learner insists on standard Pomodoros, structure them so that each 25-minute block ends at a natural stopping point (end of a paragraph, completion of a sub-problem step) rather than at an arbitrary moment in a continuous flow
- Never assign "continue working on draft" across multiple Pomodoros -- assign specific, completable sub-tasks (outline introduction, write first body paragraph, revise paragraph 3) so each Pomodoro has a defined endpoint

### The learner's source material is incomplete, disorganized, or of poor quality

When the learner shares notes that are bullet-point fragments, highlight-only PDFs, or sparse lecture summaries:
- Do not pretend the material is sufficient -- flag the gaps explicitly
- Build the Pomodoro session around the available material but add a dedicated "Fill Gaps" Pomodoro where the learner consults the textbook, asks a peer, or reviews a reliable reference for the missing sections
- Identify which concepts are missing from the notes and name them in the session plan: "Your notes do not cover [concept X]. Pomodoro 2 should locate and read the textbook section on this before proceeding."
- If the notes are so sparse that fewer than 3 Pomodoros worth of material exist, help the learner identify the full scope of what they should know, then build the session around a combination of their notes and a recommended source

---

## Example

**Input:** "I have 2 hours to study for my intro psychology exam tomorrow. The topic is classical conditioning. I have my lecture notes (they cover Pavlov's experiments, UCS/UCR/CS/CR, acquisition, extinction, spontaneous recovery, generalization, and discrimination). I've been to the lectures but haven't reviewed anything since. Standard Pomodoro please."

---

**Output:**

## Pomodoro Study Session: Psychology -- Classical Conditioning

**Subject:** Introduction to Psychology
**Specific Topic:** Classical Conditioning
**Session Date:** Today (review scheduled from date of this session)
**Total Available Time:** 120 minutes
**Pomodoros Planned:** 4
**Interval Protocol:** Standard 25 minutes work / 5 minutes break
**Session Purpose:** Review and consolidation (attended lecture, no review since)
**Source Material:** Lecture notes covering Pavlov's experiments, UCS/UCR/CS/CR, acquisition, extinction, spontaneous recovery, generalization, and discrimination

---

### Key Concepts This Session Covers

**Foundational Framework -- Pavlov's Experiment:**
- **Unconditioned Stimulus (UCS):** A stimulus that automatically triggers a response without any learning -- in Pavlov's experiment, the food powder placed in the dog's mouth
- **Unconditioned Response (UCR):** The automatic, unlearned response to the UCS -- salivation in response to food
- **Neutral Stimulus (NS):** A stimulus that initially produces no relevant response -- the bell before conditioning begins
- **Conditioned Stimulus (CS):** A previously neutral stimulus that, after repeated pairing with the UCS, comes to trigger a response on its own -- the bell after conditioning
- **Conditioned Response (CR):** The learned response to the CS alone -- salivation in response to the bell, typically slightly weaker than the UCR

**Three-Phase Model of Conditioning:**
- **Before conditioning:** NS (bell) → no salivation. UCS (food) → UCR (salivation). These are separate and unrelated.
- **During conditioning:** NS + UCS presented together repeatedly. The timing matters: the NS must precede the UCS by approximately 0.5 seconds for optimal association formation.
- **After conditioning:** CS (bell) → CR (salivation). The NS has become a CS because of its reliable predictive relationship to the UCS.

**Key Phenomena:**
- **Acquisition:** The initial learning phase during which the CS-UCS association is established. Requires multiple pairings; the strength of the association increases with each pairing up to a plateau.
- **Extinction:** The gradual weakening and disappearance of the CR when the CS is repeatedly presented without the UCS. Note: extinction is not erasure of the original learning -- it is new inhibitory learning layered on top.
- **Spontaneous Recovery:** After extinction and a rest period, the CR reappears at reduced strength when the CS is presented again -- evidence that extinction does not destroy the original association but suppresses it.
- **Generalization:** The tendency to produce a CR to stimuli that resemble the CS but are not identical -- a dog conditioned to a 500 Hz tone will also salivate to a 480 Hz tone, though less strongly.
- **Discrimination:** The opposite of generalization -- the organism learns to respond to the specific CS and not to similar stimuli, typically through selective reinforcement (CS+ paired with UCS; CS- never paired with UCS).

---

### Session Schedule

| Block | Duration | Task Type | Specific Task | Micro-Check Question |
|-------|----------|-----------|---------------|---------------------|
| **Pomodoro 1** | 25 min | Read & Annotate | Re-read your lecture notes on Pavlov's experiment and the UCS/UCR/CS/CR framework (all notes on the foundational setup). For each of the four terms, write a one-sentence definition in your own words in the margin. Draw the three-phase model (before/during/after conditioning) as a simple diagram. | Without looking at your notes, what is the difference between a UCR and a CR? |
| **Break 1** | 5 min | Active rest | Stand up, walk around, drink water. No phone, no messages. | -- |
| **Pomodoro 2** | 25 min | Summarize + Term Drill | Close your notes. Write a 6-sentence paragraph explaining classical conditioning from scratch (what it is, how it works, what changes across the three phases). Then open notes, check accuracy, and correct any errors in red ink. Spend the final 8 minutes drilling the 4 core terms: cover the definition, say it aloud, uncover, check. | Can you state what happens to the conditioned response during extinction -- and why it is not the same as forgetting? |
| **Break 2** | 5 min | Active rest | Stand, stretch your arms and neck, look out a window. No screens. | -- |
| **Pomodoro 3** | 25 min | Concept Map + Application | On a blank page, map all five key phenomena (acquisition, extinction, spontaneous recovery, generalization, discrimination) with arrows showing their relationships: which follow from which, which oppose which, which involve the CS with vs. without the UCS. Then write a real-world example of each phenomenon that does NOT come from your notes or Pavlov's dogs -- use your own scenarios. | What is the relationship between extinction and spontaneous recovery? Does spontaneous recovery mean the extinction failed? |
| **Break 3** | 5 min | Active rest | Walk to another room if possible. Hydrate. No information input. | -- |
| **Pomodoro 4** | 25 min | Full Retrieval Test | Notes closed, concept map face-down. On a blank page: (1) Define all 7 key terms from memory. (2) Explain the three-phase model. (3) Describe one study-relevant scenario (e.g., a phobia developing) and identify the UCS, UCR, CS, CR, and which phenomena are demonstrated. (4) Explain the difference between generalization and discrimination with a concrete example. After 20 minutes, open notes and mark what you got right, partially right, and wrong. | Identified during the self-test itself -- any term or concept you could not complete goes directly into the session reflection as a gap. |
| **Long Break** | 15 min | Full rest | Step away from the material entirely. Eat something, walk outside if possible. | -- |

---

### Interruption Management

**Interruption Sheet:** Keep a blank piece of paper at the edge of your desk. If a stray thought appears mid-Pomodoro -- a text you need to send, something you forgot to do, an unrelated question -- write it on this sheet and return immediately. You will handle it during the break or after the session.

| # | Interruption / Stray Thought | Handle During: |
|---|------------------------------|---------------|
| 1 | (write here as they come up) | Break / After session |
| 2 | | |
| 3 | | |

**If the Pomodoro is broken involuntarily:**
- Broken before 20 minutes: restart the Pomodoro from zero once the interruption is resolved
- Broken after 20 minutes: count as complete, record the interruption above, continue

---

### End-of-Session Self-Check

Answer these with all notes and your concept map face-down.

1. Explain classical conditioning from scratch -- stimulus, response, and how the relationship changes -- as if you are describing it to a friend who is not in your class and has never heard of it.
   - [ ] Can explain clearly without notes -- [ ] Struggled or had gaps -- needs review

2. A child burns their hand on a stove and later flinches whenever they hear the click of a stove burner igniting, even before any heat is felt. Identify the UCS, UCR, CS, and CR in this scenario. Then identify which phenomenon would occur if the parents replaced the stove with an induction model (silent) and the child gradually stopped flinching.
   - [ ] Can answer without notes -- [ ] Cannot answer -- needs review

3. Your notes give Pavlov's dog as the example of generalization. Give a completely different example -- not a dog, not a bell -- that illustrates generalization AND explain why discrimination would be adaptive in that same situation.
   - [ ] Can generate a new example -- [ ] Cannot -- needs review

4. What is the critical difference between extinction and the forgetting that happens when you simply don't think about something for a long time? (Hint: the evidence comes from spontaneous recovery.)
   - [ ] Can explain the distinction -- [ ] Cannot -- needs review

5. A therapy technique called Exposure Therapy involves repeatedly presenting a feared object or situation without any actual harm occurring. Which classical conditioning phenomenon does this directly parallel, and what does spontaneous recovery suggest about why clients sometimes need "booster" sessions?
   - [ ] Can connect the concepts -- [ ] Cannot -- needs review

---

### Session Reflection Log

*(Fill in immediately after the session -- before you do anything else)*

- Pomodoros completed: ___/4
- Total interruptions recorded: ___
- Micro-check fails (topics to revisit): ___________________________
- Terms or concepts I could not retrieve in Pomodoro 4: ___________________________
- Hardest concept this session: ___________________________
- Confidence level on classical conditioning overall (1 = very shaky, 5 = could teach it): ___/5
- One thing I will do differently in the next session: ___________________________

---

### Next Steps

**Spaced Review Schedule:**
Because this is a second encounter with the material (you attended lecture), your intervals are extended:
- Review again 7 days from today
- Review again 21 days from today
- If your Pomodoro 4 self-test revealed gaps in specific concepts (e.g., you could not distinguish spontaneous recovery from re-acquisition): review those specific concepts in 24 hours using the Term Drill task type -- not the full session

**Next Pomodoro Session Should Cover:**
Any concepts flagged in the reflection log above. If you scored 4-5 confidence overall, your next psychology session should move to the next lecture topic (likely operant conditioning) and dedicate the first Pomodoro to comparing classical and operant conditioning.

**Recommended Complementary Technique:**
Create active-recall flashcards for the 7 key terms and the three-phase model using `flashcard-generation`. These are ideal for the 24-hour and 7-day review intervals -- faster to use than re-reading notes, and the retrieval practice strengthens the same memory pathways you exercised in Pomodoro 4.

---

### Quick Reference: Pomodoro Protocol

For this session, the non-negotiables are:

1. **One task per Pomodoro.** Do not switch to a different task before the timer ends.
2. **Write distractions down, do not act on them.** Use the interruption sheet -- your stray thoughts are not urgent; they feel urgent.
3. **Breaks are physical, not digital.** The cognitive restoration that makes the next Pomodoro effective requires a genuine rest from information input. Five minutes of social media scrolling is not a break -- it is a context switch that takes 8-12 minutes to recover from.
4. **Pomodoro 4 with notes closed is the most important Pomodoro.** You may feel like you know the material after Pomodoro 2. That feeling is recognition, not retrieval. Pomodoro 4 is where you find out the truth.
5. **If you finish a task before the timer ends:** do not switch to the next task. Use the remaining time to deepen -- write a second example, review what you already wrote, test yourself further on the current material. The boundaries exist for a reason.
