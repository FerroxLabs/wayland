---
name: cornell-notes
description: |
  Creates structured notes using the Cornell method with a cue column, notes section, and summary for learners. Produces a filled-in Cornell notes template from provided content -- not an explanation of how Cornell notes work.
  Use when a learner asks to take notes using the Cornell method, organize lecture notes, create structured study notes, or convert raw notes into Cornell format.
  Do NOT use for concept mapping (use `concept-mapping`), for note synthesis across sources (use `note-synthesis`), or for flashcard creation (use `flashcard-generation`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "note-taking study-skills step-by-step guide"
  category: "education"
  subcategory: "self-learning"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Cornell Notes

## When to Use

Use this skill when the learner wants a completed Cornell notes artifact -- a fully filled-in, study-ready document -- from source material they provide.

**Trigger scenarios:**
- A student says "make Cornell notes for my lecture on [topic]" or "convert my notes into Cornell format"
- A learner pastes raw lecture notes, a textbook excerpt, a transcript, or bullet-point outlines and asks for structured notes
- Someone preparing for an exam asks to organize their review material using the Cornell method
- A learner who already knows the Cornell system wants the AI to do the heavy lifting of structuring their messy notes
- A student asks to "fill out" or "set up" Cornell notes for a specific chapter, unit, or concept
- Someone explicitly mentions wanting a cue column, notes section, and summary for their material
- A learner wants to revisit old notes and reformat them into Cornell structure for active recall practice

**Do NOT use when:**
- The learner wants to connect ideas visually across a concept or topic web -- use `concept-mapping` instead
- The learner wants to compare, merge, or synthesize multiple source documents into a single set of unified notes -- use `note-synthesis` instead
- The learner wants flashcards or retrieval practice cards generated from their material -- use `flashcard-generation` instead
- The learner wants to test themselves with practice questions -- use `exam-practice` instead
- The learner is an educator designing a lesson plan or handout for students -- use an appropriate teaching-materials skill instead
- The learner wants a mind map or outline format -- these are structurally different from Cornell notes and serve different cognitive purposes
- The content is primarily mathematical derivations or proofs -- raw symbolic math does not map cleanly to the Cornell prose structure; suggest a worked-example format instead

---

## Process

### Step 1: Gather the Essential Inputs

Before producing any notes, collect what you need. Do not guess or fabricate content.

- **Source material** -- This is the most critical input. Ask the learner to paste or describe: a lecture transcript, a slide deck summary, raw bullet-point notes, a textbook passage, or a video outline. If none is provided, ask for it before proceeding.
- **Subject and specific topic** -- Confirm both. "Biology" is insufficient; "Biology -- Cell Membrane Transport Mechanisms" is the right level of specificity.
- **Depth and scope** -- Ask how much material needs to be covered. A single lecture (typically 45--90 minutes of content) is ideal for one Cornell notes page. If the material is longer, plan to divide it into logical sub-sections, each treated as its own Cornell page or clearly demarcated block.
- **Purpose** -- Is the learner preparing for an exam, building foundational understanding, or revisiting material from weeks ago? This affects how much depth to put into the cue column and how synthesis-heavy the summary should be.
- **Knowledge level** -- A beginner needs definitions embedded in the notes; an advanced student needs connections, contrasts, and edge cases highlighted. Ask if unclear.

If the learner provides all of this unprompted, proceed directly to Step 2 without asking redundant questions.

---

### Step 2: Analyze the Source Material Before Writing

Before writing a single note, mentally (or explicitly) parse the source material through these lenses:

- **Identify the hierarchy of ideas.** Every piece of content has main ideas, supporting details, and illustrative examples. Cornell notes work because the cue column tests at the main-idea level while the notes section contains the supporting detail. Identify 3--8 main ideas per logical page of content -- fewer means the material is thin, more means you need to split the section.
- **Flag key terminology.** Any technical term that appears for the first time belongs in the notes section with its definition on first use. Terms that are central to the topic should generate a cue-column question.
- **Identify relationships.** Look for cause-and-effect chains (A leads to B leads to C), comparisons (A vs. B), sequences (steps 1 through N), and classifications (type X vs. type Y). These relationships should be made explicit in the notes section -- not just listed as isolated facts.
- **Identify examples and analogies.** Real-world examples and analogies dramatically improve recall. If the source material contains them, preserve them verbatim or paraphrase them clearly. If the source lacks examples and the concept is abstract, generate one concrete example per abstract concept.
- **Flag gaps and ambiguities.** If the source material uses undefined jargon, contains apparent contradictions, or references prior content the learner may not have, note these explicitly with a "?" marker in the notes so the learner knows what to investigate further.

---

### Step 3: Build the Notes Section

The notes section is the right-hand column -- the largest section, occupying approximately 70% of the page width. Write it first, because the cue column is derived from it.

- **Use phrases and short sentences, not single words.** A note that says "mitosis" tells the learner nothing. A note that says "Mitosis = cell division producing 2 identical daughter cells; 4 phases: prophase, metaphase, anaphase, telophase" is reviewable without the original source.
- **Capture the main idea of each concept as a complete, standalone thought.** The test: can a learner who has forgotten the lecture reconstruct the concept from the notes section alone? If not, add more.
- **Indent supporting details under main ideas.** Use a consistent indentation pattern: main idea flush left, supporting details indented once, examples or sub-details indented twice. This visual hierarchy is essential -- it shows the learner which details belong to which concept.
- **Use standard abbreviations consistently.** A reliable set: "w/" (with), "b/c" (because), "→" (leads to / causes), "↑" (increases), "↓" (decreases), "=" (equals / is defined as), "≠" (is not / differs from), "∴" (therefore), "e.g." (for example), "i.e." (that is), "def:" (definition). Introduce abbreviations at first use and apply consistently throughout.
- **Skip a line between distinct main ideas.** Visual whitespace is not wasted space -- it signals concept boundaries and makes the cue column questions easier to align.
- **Include diagrams and tables using text-based representations where visual content matters.** If the source covers a process with clear stages, render it as a numbered list or arrow-chain (Stage 1 → Stage 2 → Stage 3). If the source involves a comparison, use a mini-table with headers.
- **Mark confusing or incomplete points with "??"** placed inline so the learner knows exactly where their understanding breaks down.
- **Preserve the language of key technical terms exactly as they appear** in the source. Never paraphrase a definition that has precise wording -- misparaphrase a technical definition and you create a studying liability.

---

### Step 4: Build the Cue Column

The cue column is the left-hand column -- approximately 30% of page width, written after the notes section is complete. This is the active recall engine of the Cornell system.

- **Write one cue per distinct main idea** in the notes section. Align the cue vertically with the note it tests. If the notes section has 7 main ideas, the cue column has 7 entries.
- **Frame every cue as a retrieval question, not a label.** The difference is critical:
  - Weak cue (label): "Osmosis"
  - Strong cue (retrieval question): "What is osmosis, and in which direction does water move across a semipermeable membrane?"
  - Weak cue (label): "Extinction"
  - Strong cue (retrieval question): "What is extinction in classical conditioning, and how does it differ from forgetting?"
- **Write cues that test the right cognitive level for the purpose.** For basic understanding, cues test definitions and facts. For exam preparation, cues test application ("How would you apply X to solve Y?"), comparison ("What distinguishes X from Z?"), and explanation ("Why does X cause Y rather than Z?"). For deep understanding, cues test synthesis ("How does X connect to the broader principle of Y?").
- **Cue questions should be answerable from the notes section alone** -- not from outside knowledge. If you write a cue question whose answer is not in the notes section, either add the answer to the notes section or drop the cue.
- **Keep cues short -- one to two lines maximum.** The cue column is narrow. If the question runs long, tighten the language.
- **Include at least one "explain in your own words" cue** per page for the most central concept. Recall of verbatim definitions is weaker than generative explanation.

---

### Step 5: Write the Summary Section

The summary is a 3--5 sentence paragraph at the bottom of the page, written after both the notes section and cue column are complete. It is the hardest part of the Cornell system to do correctly and the part most often done badly.

- **The summary must synthesize, not list.** A summary that says "This page covered osmosis, diffusion, active transport, and passive transport" is a table of contents -- it adds no value. A correct summary sounds like: "Cell membrane transport falls into two categories based on energy use. Passive transport (diffusion, osmosis, facilitated diffusion) moves substances down their concentration gradient without ATP. Active transport moves substances against their gradient and requires ATP and carrier proteins. The distinction between these mechanisms determines how cells regulate internal chemistry."
- **Write the summary in the learner's own words, not copied phrases.** This forces genuine processing. If the learner's source material is being directly converted by the AI, write the summary as a generative synthesis of the notes -- no more than 20% of its wording should match the notes section verbatim.
- **The summary should answer the implicit big question** of the page: "What is the central point of all this content, and why does it matter?" If the material has a real-world application or connects to a prior concept, the summary is the right place to state that connection.
- **Length target: 40--80 words.** Shorter and the synthesis is probably superficial. Longer and it is becoming a re-statement of the notes rather than a synthesis.
- **For multi-page note sets**, each page has its own summary. Do not write one master summary for 8 pages -- the Cornell system requires page-level summaries because they are tied to the cue-column review process.

---

### Step 6: Add the Self-Check and Review Schedule

After the Cornell notes artifact is complete, append a brief self-check and a spaced repetition schedule. These are non-optional components because they transform a static note into an active study tool.

- **Self-check questions** should test the highest-cognitive-level cue on each page: Can the learner explain the central concept without looking? Can they distinguish the most commonly confused terms? Can they apply a concept to a new scenario? Frame these as checkboxes the learner can act on immediately.
- **Spaced repetition schedule** -- the research-backed timing for Cornell notes review is: first review within 24 hours of creation, second review at Day 3--4, third review at Day 7--10, fourth review at Day 21--30. The first review uses the cue column exclusively: cover the notes section, answer each cue question aloud, then uncover to verify. If a review is being scheduled for exam preparation, compress the intervals proportionally to the exam date.
- **Identify any gaps** that surfaced during note construction -- undefined terms, concepts mentioned but not explained in the source, or "??" markers -- and recommend a targeted action (look up in textbook, ask the instructor, compare with a classmate's notes).
- **Suggest one complementary technique** that logically follows from the content type: dense vocabulary material → `flashcard-generation`; highly comparative content → a comparison table; process-based content → a flowchart; multi-source topics → `note-synthesis`.

---

### Step 7: Final Quality Pass

Before delivering the output, verify:

- Every cue question has an answer that is locatable in the notes section
- No cue is a single-word label
- The summary does not copy sentences from the notes section
- All key technical terms are defined on first use
- At least one concrete example or analogy exists for each abstract concept
- Any "??" gaps are visible and noted in the self-check
- The output is divided into clearly labeled sections matching the output format

---

## Output Format

Deliver the output in the following structure. Every section is required. Do not omit sections because the material seems simple or the learner seems advanced.

```
## Cornell Notes: [Specific Topic Title]

**Subject:** [Discipline, e.g., Microbiology, Macroeconomics, U.S. History]
**Topic:** [Specific lecture/chapter topic]
**Source:** [Description of source material, e.g., "Lecture 7 transcript", "Chapter 4 reading"]
**Scope:** [e.g., "Single lecture -- ~50 min", "Textbook section 3.2--3.4"]
**Purpose:** [e.g., "Exam preparation", "First-pass understanding", "Review of prior material"]

---

### Page 1 of [N]: [Sub-topic title if multi-page]

+-------------------------------+---------------------------------------------------+
| CUE COLUMN                    | NOTES SECTION                                     |
+-------------------------------+---------------------------------------------------+
| [Retrieval question 1?]       | [Main idea 1 -- complete thought]                 |
|                               |   - [Supporting detail]                           |
|                               |   - [Supporting detail]                           |
|                               |     * [Example or sub-detail]                     |
+-------------------------------+---------------------------------------------------+
| [Retrieval question 2?]       | [Main idea 2 -- complete thought]                 |
|                               |   - [Supporting detail]                           |
|                               |   - [Supporting detail]                           |
+-------------------------------+---------------------------------------------------+
| [Retrieval question 3?]       | [Main idea 3 -- complete thought, with def:]      |
|                               |   - [Sub-point]                                   |
|                               |   - [Sub-point]                                   |
|                               |   ?? [Flagged gap or ambiguity]                   |
+-------------------------------+---------------------------------------------------+
| ... (continue for all         | ... (continue for all main ideas)                 |
|     main ideas)               |                                                   |
+-------------------------------+---------------------------------------------------+

**SUMMARY:**
[3--5 sentence synthesizing paragraph. States the central claim, the key
relationships or mechanisms, and the real-world significance. Does NOT
simply list the topics covered. 40--80 words.]

---

### [Repeat Page block for each logical page of content if multi-page]

---

### Self-Check

Answer these without looking at the notes section -- use only the cue column.

- [ ] [Highest-stakes recall question for this content]
- [ ] [Application or comparison question]
- [ ] [Explain-in-your-own-words question for the central concept]
- [ ] Gaps to resolve: [List any "??" items from the notes, or "None identified"]

---

### Review Schedule (Spaced Repetition)

| Review     | When                    | Method                                              |
|------------|-------------------------|-----------------------------------------------------|
| Review 1   | Within 24 hours         | Cover notes; answer each cue aloud; verify          |
| Review 2   | Day 3--4                | Cover notes; answer cues; write summary from memory |
| Review 3   | Day 7--10               | Answer cues; then close notes and explain to self   |
| Review 4   | Day 21--30              | Full cue-column quiz; note any faded knowledge      |

---

### Next Steps

- **Gaps to address:** [Any "??" items or undefined concepts from the notes]
- **Complementary technique:** [One specific follow-on skill based on content type]
- **Connection to broader material:** [How this topic connects to adjacent concepts in the course]
```

---

## Rules

1. **Never produce the artifact without source material.** If the learner says "make Cornell notes on photosynthesis" with no source content, ask them to provide their lecture notes, textbook passage, or at minimum a detailed outline of what was covered. Do not generate notes from background knowledge alone -- the notes must reflect the learner's actual course content, not a generic encyclopedic summary of the topic.

2. **The cue column must contain retrieval questions, never single-word labels.** A cue that says "Equilibrium" is a label. A cue that says "What conditions define chemical equilibrium, and how does Le Chatelier's principle predict the response to a disturbance?" is a retrieval question. Every single entry in the cue column must end with a question mark or function as a generative prompt ("Describe the three stages of...").

3. **The summary must synthesize, not enumerate.** If the summary begins with "This page covered..." or is a bulleted list of topics, it is wrong. Rewrite it as a cohesive paragraph that states the central insight and its significance.

4. **Define every technical term on first use in the notes section.** Do not assume the learner knows the definition -- even if they seem advanced. The notes section must be self-contained: someone re-reading it three weeks before an exam should not need to look anything up.

5. **Use exactly the source material provided.** Do not substitute generic textbook content for the learner's course-specific material. If the learner's professor uses idiosyncratic terminology or a non-standard framework, preserve that terminology -- it is what will appear on their exam.

6. **Limit each Cornell page to 3--8 main ideas.** Fewer than 3 means the material is too thin to require Cornell structure -- tell the learner and suggest a simpler format. More than 8 means the material is too dense for one page -- split it at a logical conceptual boundary and create a new page.

7. **Every abstract concept must have at least one concrete example.** This is the single most impactful way to improve retention. If the source material does not supply examples, generate one. Label generated examples clearly as "[Example]" so the learner distinguishes them from course content.

8. **The first review must be scheduled within 24 hours.** Research on the forgetting curve (Ebbinghaus, 1885; confirmed in subsequent spaced repetition literature) shows that without review, 50--80% of new information is lost within 24 hours. Any review schedule that starts later than this is pedagogically unsound. If the learner mentions an exam date, compress all intervals proportionally.

9. **Do not pad the notes section with filler.** Every line in the notes section must carry information that a cue question could test. If a sentence is present only to provide narrative flow and would not appear in any cue question, cut it. Cornell notes are dense reference documents, not essays.

10. **If content spans multiple pages, each page gets its own complete summary.** Do not write a single summary for multi-page note sets. The Cornell review method requires page-level summaries because the learner reviews one page at a time, covering and uncovering sections. A single master summary breaks this review workflow.

---

## Edge Cases

### The Source Material Is Extremely Dense (Graduate-Level or Highly Technical Content)

Dense technical content -- quantum mechanics derivations, legal statutes, advanced pharmacology -- requires special handling. Do not try to compress everything into one Cornell page and risk producing superficial notes.

- First, identify the conceptual skeleton: the 5--8 central claims the entire passage builds toward. These become the main ideas in the notes section.
- Secondary technical details (derivations, specific numerical thresholds, exceptions) become sub-bullets indented under the main idea they support.
- For highly mathematical or symbolic content, the notes section can embed simplified text descriptions alongside the symbolic notation: "Maxwell's 4th equation (Ampere-Maxwell Law): changing electric fields produce magnetic fields. ∇ × B = μ₀J + μ₀ε₀(∂E/∂t)"
- Flag anything where the symbolic derivation cannot be meaningfully summarized in prose: "?? Full derivation too symbolic to compress here -- see problem set 3 worked solution."
- The cue column in this context should test conceptual understanding, not symbolic recall: "What physical phenomenon does Maxwell's 4th equation describe, and why was adding the displacement current term essential?"

### The Learner Provides Raw, Disorganized Notes

Real student notes are often incomplete: fragmented sentences, gaps where the student couldn't keep up, inconsistent terminology, abbreviations that only made sense in the moment.

- Reconstruct ambiguous fragments using context from the surrounding notes. If "→ calcium" appears after a sentence about muscle contraction, a reasonable inference is that calcium release is the next step in the process. Make this explicit: "→ calcium release from SR triggers myosin binding."
- Mark inferred or reconstructed content clearly with "[inferred from context]" so the learner can verify.
- If a gap is too large to reconstruct confidently (entire sub-sections are missing), note it explicitly in the cue column: "MISSING: Notes on [sub-topic] -- consult textbook section X.X before exam."
- Do not invent content that has no basis in the source. Making up plausible-sounding details that are factually wrong is worse than leaving a gap.

### The Learner Provides More Than One Lecture Worth of Content

If the source material clearly covers more than one distinct lecture, chapter, or thematic unit, treat each unit as a separate Cornell notes page or block.

- Identify natural boundary points: the point where the source shifts from one mechanism to another, from theory to application, from one historical period to the next.
- Create a multi-page notes set with one summary per page.
- If the total content is so large that producing complete notes in one response is impractical, produce notes for the first logical unit, then explicitly tell the learner: "This covers [Unit 1]. Send the next section and I'll continue with Page 2." Do not produce partial notes without telling the learner.
- Provide a table of contents at the top of a multi-page set so the learner can navigate across pages.

### The Learner Is Unfamiliar with the Cornell Method

If the learner asks "what is the Cornell method?" or indicates they have never used it, provide a brief (4--6 sentence) explanation before producing the notes:

"The Cornell method divides a page into three zones: a narrow left column (the cue column), a wider right column (the notes section), and a bottom strip (the summary). During or after a lecture, you fill in the notes section with main ideas and supporting details. Then you write retrieval questions in the cue column that the notes section answers. The summary at the bottom synthesizes the whole page in your own words. To study, cover the notes section with a sheet of paper and answer each cue question from memory. This system forces active retrieval -- which research consistently shows is more effective for long-term retention than re-reading."

Then proceed directly to producing the notes. Do not ask the learner to confirm they understand the method before proceeding.

### The Material Is Primarily a Sequence of Steps or a Process

Some content -- lab procedures, historical event sequences, software development workflows, chemical synthesis routes -- is inherently sequential rather than hierarchical. Adapt the notes section structure accordingly.

- Number each step explicitly: "Step 1: [action + why it is done at this stage]"
- Add a visual arrow-chain summary of the sequence below the last step: "Step 1 → Step 2 → Step 3 → outcome"
- Cue questions for sequential content should test the logic of the sequence: "What would happen if Step 3 were performed before Step 2?" and "What is the purpose of Step 4 specifically, and why can't it be omitted?"
- The summary for process content should describe the overall goal of the process, the key decision points or branch conditions, and the consequence of each major step's output feeding into the next.

### The Learner Wants to Add Material After the Initial Notes Are Produced

If the learner says "I forgot to include [X]" or "my professor also mentioned [Y]," integrate the addition rather than rewriting the entire output.

- Identify where in the existing notes section the new material logically fits (by main idea or by sequence).
- Insert it with an indented addition, clearly marked: "[Added: ...]"
- Check whether the new material requires a new cue question. If yes, add one to the cue column.
- If the new material is significant enough to change the summary's central claim, revise the summary. If it is a supporting detail that doesn't alter the main synthesis, the summary may remain unchanged -- but flag whether the learner should consider revising it.

### Content in a Language the Learner Is Still Learning

If a student is studying source material in a foreign language (e.g., a French-language history lecture for a student with intermediate French), allow bilingual notes.

- Key terms and definitions: preserve them in the source language, then provide the translation in brackets immediately after: "photosynthèse [photosynthesis] = ..."
- Notes section prose: write in whichever language the learner requests -- default to their native language for the notes section if they do not specify, since comprehension is the goal.
- Cue column questions: write in the learner's native language. The goal of the cue column is active recall of concepts, not vocabulary practice.
- Summary: write in the learner's native language.
- Do not conflate language acquisition and content learning. If the learner wants to practice the foreign language itself, that is a language-learning task outside this skill's scope.

---

## Example

**Input:** "Can you create Cornell notes from my lecture on the French Revolution? Here are my notes from class: 'financial crisis -- France broke from wars + Versailles spending / Estates system: 1st = clergy, 2nd = nobility, 3rd = everyone else (97% of pop) / 3rd Estate paid taxes, others didn't / Estates-General called 1789 first time since 1614 / Tennis Court Oath -- June 1789 / Bastille stormed July 14 1789 / Declaration of Rights of Man Aug 1789 / phases: constitutional monarchy → republic → Reign of Terror (Robespierre) → Thermidorian reaction → Directory / Terror: ~17,000 executions Sept 1793 -- July 1794 / Napoleon ends Revolution 1799 coup'"

**Purpose:** Midterm exam prep in two weeks.

---

**Output:**

## Cornell Notes: The French Revolution

**Subject:** History (European History / World History)
**Topic:** The French Revolution -- Causes, Key Events, and Phases
**Source:** Lecture notes from class session
**Scope:** Single lecture -- overview of revolution from causes through 1799
**Purpose:** Midterm exam preparation (2 weeks out)

---

### Page 1 of 2: Causes and Outbreak (Pre-1789 -- July 1789)

```
+--------------------------------+------------------------------------------------------+
| CUE COLUMN                     | NOTES SECTION                                        |
+--------------------------------+------------------------------------------------------+
| What were the two main         | Financial Crisis -- Root Cause                       |
| financial causes of the        |   - France bankrupted by:                            |
| French Revolution?             |     * Costly wars (esp. Seven Years' War,            |
|                                |       American Revolution support)                   |
|                                |     * Lavish spending at Versailles under Louis XVI  |
|                                |   - Government could not pay debts → desperate       |
|                                |     need for new tax revenue                         |
+--------------------------------+------------------------------------------------------+
| Describe the Estates system.   | The Three Estates -- Social Structure                |
| Which estate bore the tax      |   def: The Estates = France's rigid social           |
| burden, and why was this       |         hierarchy dividing the population into       |
| politically explosive?         |         3 legal categories                           |
|                                |   - 1st Estate: Clergy -- ~0.5% of population;      |
|                                |     owned 10% of land; exempt from taxes             |
|                                |   - 2nd Estate: Nobility -- ~1.5% of population;    |
|                                |     extensive privileges; largely tax-exempt         |
|                                |   - 3rd Estate: Everyone else -- 97% of population  |
|                                |     (peasants, urban workers, bourgeoisie);          |
|                                |     bore nearly all tax burden                       |
|                                |   [Example] Like three workers where two are         |
|                                |   exempt from paying rent and the third pays         |
|                                |   for all three -- indefinitely.                     |
+--------------------------------+------------------------------------------------------+
| Why was calling the            | Estates-General -- 1789                              |
| Estates-General in 1789        |   - King Louis XVI called Estates-General in May     |
| significant? What dispute      |     1789 to address financial crisis                 |
| immediately arose?             |   - First meeting since 1614 (175-year gap) →        |
|                                |     no established procedure → instant conflict      |
|                                |   - Core dispute: How to vote?                       |
|                                |     * Traditional method: one vote per Estate        |
|                                |       (1st + 2nd always outvote 3rd, 2-to-1)         |
|                                |     * 3rd Estate demanded: one vote per delegate     |
|                                |       (would reflect their numerical majority)       |
|                                |   ?? Lecture didn't clarify what vote count          |
|                                |     each Estate had -- confirm in textbook           |
+--------------------------------+------------------------------------------------------+
| What was the Tennis Court      | Tennis Court Oath -- June 20, 1789                   |
| Oath, and what did it          |   - 3rd Estate delegates locked out of meeting hall  |
| signal about the               |     → reconvened at a nearby tennis court            |
| Revolution's direction?        |   - Swore not to disband until France had a          |
|                                |     written constitution                             |
|                                |   - Significance: 3rd Estate declared itself the    |
|                                |     true representative of the French nation;        |
|                                |     direct challenge to royal authority              |
|                                |   → Escalation sequence: Oath → Louis XVI            |
|                                |     mobilizes troops → popular uprising in Paris     |
+--------------------------------+------------------------------------------------------+
| What happened on July 14,      | Fall of the Bastille -- July 14, 1789                |
| 1789, and why is it the        |   - Parisian crowd stormed the Bastille prison       |
| symbolic start of the          |   - Practical reason: seized gunpowder and weapons  |
| Revolution?                    |   - Symbolic reason: Bastille = royal tyranny;       |
|                                |     its fall = people's power over the king         |
|                                |   - Now France's national holiday (Bastille Day)    |
|                                |   Note: Only 7 prisoners inside when stormed --     |
|                                |   its symbolic significance >> its practical one    |
+--------------------------------+------------------------------------------------------+
```

**SUMMARY:**
The French Revolution's outbreak resulted from compounding structural failures: a state bankrupt from wars and royal excess, a tax system that punished 97% of the population while exempting the privileged, and a political system so outdated it lacked a procedure for its first meeting in 175 years. When the 3rd Estate refused to accept this structure and the king threatened force, popular anger transformed a fiscal crisis into a constitutional revolution. The Bastille's fall on July 14, 1789 was the point of no return.

---

### Page 2 of 2: Phases of the Revolution (1789--1799)

```
+--------------------------------+------------------------------------------------------+
| CUE COLUMN                     | NOTES SECTION                                        |
+--------------------------------+------------------------------------------------------+
| What document did the          | Declaration of the Rights of Man -- Aug 1789         |
| Revolution produce in Aug      |   - Declared liberty, equality, and popular          |
| 1789, and what Enlightenment   |     sovereignty as natural rights                    |
| principles did it reflect?     |   - Directly influenced by Enlightenment thinkers   |
|                                |     (Locke, Rousseau) and the U.S. Declaration      |
|                                |   - Applied to male citizens; women explicitly       |
|                                |     excluded (Olympe de Gouges wrote a parallel      |
|                                |     Declaration for women in 1791 -- suppressed)    |
+--------------------------------+------------------------------------------------------+
| List the 5 phases of the       | Phases of the Revolution -- Sequence                 |
| Revolution in order. What      |                                                      |
| ended each phase?              |   Phase 1: Constitutional Monarchy (1789--1792)      |
|                                |   - King retains throne but under a constitution     |
|                                |   - Ended when Louis XVI tried to flee France        |
|                                |     → caught at Varennes → trust destroyed           |
|                                |                                                      |
|                                |   Phase 2: Republic (1792--1793)                     |
|                                |   - Monarchy abolished; Louis XVI executed           |
|                                |     Jan 21, 1793                                     |
|                                |   - Ended as foreign war + internal rebellion        |
|                                |     created panic → extremists took control          |
|                                |                                                      |
|                                |   Phase 3: Reign of Terror (Sept 1793 -- July 1794) |
|                                |   - Led by Robespierre + Committee of Public Safety  |
|                                |   - ~17,000 official executions by guillotine;       |
|                                |     est. 40,000 total deaths incl. imprisonment     |
|                                |   - Justified as defense of revolution against       |
|                                |     "enemies" -- definition expanded constantly      |
|                                |   - Ended when Robespierre himself arrested and      |
|                                |     guillotined July 1794 (Thermidorian Reaction)    |
|                                |                                                      |
|                                |   Phase 4: Thermidorian Reaction (1794--1795)        |
|                                |   - Conservative backlash against Terror's excess    |
|                                |   - Surviving moderates reasserted control           |
|                                |                                                      |
|                                |   Phase 5: The Directory (1795--1799)                |
|                                |   - 5-man executive committee ruled France           |
|                                |   - Unstable, corrupt, unable to resolve crisis      |
|                                |   → Ended with Napoleon's coup Nov 9, 1799           |
|                                |     (18 Brumaire) → Revolution officially over       |
+--------------------------------+------------------------------------------------------+
| Why is the Reign of Terror     | Reign of Terror -- Key Details                       |
| considered paradoxical for     |   - Robespierre's logic: temporary violence           |
| a revolution founded on        |     necessary to protect permanent liberty           |
| liberty?                       |   - Paradox: revolution that began by opposing       |
|                                |     royal tyranny produced its own systematic        |
|                                |     political violence and suppression               |
|                                |   [Example] Similar dynamic appears in other         |
|                                |   revolutions (Russian, Chinese) where liberation    |
|                                |   movements became oppressive -- a pattern worth     |
|                                |   noting for comparative history questions           |
+--------------------------------+------------------------------------------------------+
| How did Napoleon end the       | Napoleon's Coup -- 1799                              |
| Revolution, and did it         |   - Napoleon Bonaparte seized power Nov 1799         |
| represent success or           |     in the coup of 18 Brumaire                       |
| failure of revolutionary       |   - Ended the Directory; established Consulate       |
| ideals?                        |     (Napoleon as First Consul)                       |
|                                |   - Debate: Did Napoleon fulfill or betray the       |
|                                |     Revolution?                                      |
|                                |     * Fulfill: preserved legal equality, Napoleonic  |
|                                |       Code, meritocracy over aristocracy             |
|                                |     * Betray: restored one-man rule, censorship,     |
|                                |       and eventually an imperial title               |
|                                |   ?? Lecture didn't take a position on this --       |
|                                |     check if prof has a stated view (likely exam Q) |
+--------------------------------+------------------------------------------------------+
```

**SUMMARY:**
The Revolution cycled through five distinct phases in ten years, each a reaction to the instability of the previous one. What began as a constitutional reform movement radicalized under the pressure of war and internal rebellion into the Terror, where the revolution consumed its own architects. The Thermidorian Reaction and the Directory failed to establish durable governance, leaving a vacuum that Napoleon exploited in 1799. Whether Napoleon represented the Revolution's logical conclusion or its ultimate contradiction is the central interpretive debate of this period.

---

### Self-Check

Answer these using only the cue column -- cover the notes section completely.

- [ ] Without looking: list the 5 phases of the Revolution in order and state what ended each one
- [ ] Explain why the Estates system made revolution structurally inevitable -- use specific numbers
- [ ] What is the paradox of the Reign of Terror, and can you state it in one sentence in your own words?
- [ ] Gaps to resolve: (1) Confirm vote-count structure of the Estates-General from textbook; (2) Find professor's stated position on Napoleon's legacy -- likely an essay or exam question

---

### Review Schedule (Spaced Repetition)

Adjusted for midterm in approximately 14 days.

| Review     | When              | Method                                                        |
|------------|-------------------|---------------------------------------------------------------|
| Review 1   | Tonight           | Cover notes; answer all cue questions aloud; verify answers  |
| Review 2   | Day 3             | Cover notes; write both summaries from memory; compare       |
| Review 3   | Day 7             | Cue-column quiz + explain the 5-phase sequence to someone    |
| Review 4   | Day 12 (2 days before midterm) | Full cue quiz; flag any faded answers for final pass |

---

### Next Steps

- **Gaps to address:** Confirm Estates-General voting structure (textbook cross-check); find professor's interpretive stance on Napoleon -- this is a high-probability essay question
- **Complementary technique:** The 5 phases with dates and the 3 Estates with statistics are excellent flashcard material -- use `flashcard-generation` for those specific facts
- **Connection to broader material:** Compare the Terror's logic ("temporary violence for permanent liberty") with the Bolshevik Red Terror in the Russian Revolution -- if your course covers both, this comparison is a likely long-form essay prompt
