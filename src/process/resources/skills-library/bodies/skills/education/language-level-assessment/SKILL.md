---
name: language-level-assessment
description: |
  Creates CEFR-aligned self-assessment diagnostics to help language learners determine their current proficiency level (A1-C2) and identify specific areas for improvement. Produces a level estimation with next steps.
  Use when a learner asks to assess their language level, determine their CEFR level, find out where they are in language learning, or identify what to study next.
  Do NOT use for vocabulary assessment (use `vocabulary-building`), for grammar diagnostics (use `grammar-practice`), or for exam-specific preparation (use `certification-prep`).
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
# Language Level Assessment

## When to Use

Use this skill when any of the following trigger conditions are present:

- A learner explicitly asks to assess, test, or determine their current level in a language (e.g., "What level is my French?", "Am I B1 or B2 in Spanish?", "Help me figure out where I am in my Japanese studies")
- A learner has returned from a break (weeks or months away from study) and wants to recalibrate before resuming -- level drift is real and common after gaps
- A learner is preparing to enroll in a course and needs to know which level to register for, without needing exam-specific prep coaching
- A learner is unsatisfied with their current course or textbook and suspects it is pitched at the wrong level (too easy/too hard)
- A learner reports a specific skill imbalance -- for example, "I can read well but can't speak" -- and wants to map their uneven profile across CEFR dimensions
- A learner is switching languages (e.g., from Spanish to Portuguese) and wants to estimate transfer credit -- how much of their prior knowledge bootstraps the new language
- A learner asks "What should I study next?" without clear knowledge of where they currently are -- the diagnostic must precede the prescription

**Do NOT use when:**

- The user wants to build vocabulary systematically at a known level -- use `vocabulary-building` instead, which handles spaced repetition, frequency lists, and word-family expansion
- The user wants targeted grammar diagnosis and drills on specific structures (e.g., subjunctive, case endings, aspect) -- use `grammar-practice`, which generates structured grammar exercises
- The user is preparing for a specific certification exam (DELF, IELTS, HSK, JLPT, DELE, Goethe-Zertifikat) -- use `certification-prep`, which addresses exam format, scoring rubrics, and timed practice
- The user is asking for a pronunciation assessment -- articulatory phonetics and accent analysis are outside CEFR self-diagnostics and require `pronunciation-guide`
- The user is an educator designing placement tests for a class -- this skill targets individual learner self-assessment, not institutional test design
- The user already knows their level with confidence and wants a study plan -- proceed directly to `immersion-plan` or the appropriate skill without repeating assessment
- The user is assessing a heritage language situation with complex native/non-native background -- these profiles resist standard CEFR framing and need careful handling (see Edge Cases)

---

## Process

### Step 1: Gather the Target Language and Learner Context

Before running any diagnostic, collect the minimum viable context. Ask the learner directly if they have not already provided:

- **Target language** -- which language is being assessed (this matters because CEFR applies universally but diagnostic questions must be language-specific; Spanish B2 reading ≠ Japanese B2 reading in cognitive demand)
- **Native language(s)** -- affects the relative difficulty of reaching each CEFR threshold; a Spanish L1 speaker reaching B2 in Italian faces a fundamentally different challenge than reaching B2 in Finnish
- **Approximate time studying** -- total hours or months/years of exposure, even rough estimates; used to reality-check self-reported level against known acquisition research benchmarks
- **Learning context** -- classroom instruction, self-study, immersion, combination; this determines which modalities have been trained and which neglected
- **Motivation and use case** -- travel, work, academic, personal; this calibrates which skill domains matter most in the assessment output
- **Any prior formal level or test result** -- previous placement test, course level completed, or informal teacher estimate; prior data anchors the diagnostic

Do NOT proceed with a generic diagnostic that ignores the target language. A Chinese-character-based language (Mandarin, Japanese, Cantonese) has fundamentally different reading thresholds than an alphabetic Romance language.

### Step 2: Set Expectations About CEFR and Self-Assessment Validity

Before delivering the diagnostic, briefly orient the learner to three critical truths:

- **CEFR levels are not equal-sized steps.** The distance from A1 to A2 is much shorter than B1 to B2. Research from the Common European Framework and the Foreign Service Institute (FSI) suggests that reaching B2 in a Category I language (Spanish, French, Italian) from zero requires approximately 600--750 classroom hours. Reaching B2 in a Category IV language (Arabic, Mandarin, Japanese, Korean) requires 2,200+ hours. Learners frequently underestimate their level at the bottom (A1/A2 feel "too basic") and overestimate at the top (C1/C2 feel aspirationally achievable).
- **Skills are typically uneven.** Most learners have a jagged profile -- reading and listening are typically ahead of speaking and writing in formal instruction; speaking is ahead in immersion contexts. The diagnostic will produce a profile, not a single number.
- **This is a calibration tool, not a certification.** The output is a directional estimate with ±1 sub-level margin of error. It is not equivalent to a proctored CEFR exam.

### Step 3: Administer the Structured Can-Do Diagnostic

Deliver the diagnostic using the graduated can-do statement format anchored to CEFR descriptors. Structure it across four skill domains. For each domain, present statements in ascending order and instruct the learner to mark the highest consecutive tier where they can answer "yes with confidence" -- not "sometimes" or "with effort on a good day."

**Critical refinement:** Within each CEFR band, offer two sub-items to distinguish lower-B1 from upper-B1, lower-B2 from upper-B2, etc. This distinguishes learners who are consolidating at a level from those ready to transition.

Use the full diagnostic template in the Output Format section. When delivering this interactively, present one skill at a time, allow the learner to respond, then probe with follow-up questions at the boundary levels they identify.

**Boundary probing questions** (to distinguish B1 vs B2 in speaking, for example):
- "Can you maintain a conversation about an abstract topic (politics, ethics, hypotheticals) for 10+ minutes without switching to your native language?"
- "When you make errors, do listeners frequently ask for clarification, or do they understand despite the errors?"
- "Can you correct yourself mid-sentence when you notice an error?"

These functional questions are more diagnostic than can-do checkboxes alone.

### Step 4: Apply the Reality-Check Matrix

After collecting self-reported skill levels, cross-reference with objective indicators using this evidence-based correction process:

- **Hours-to-level benchmarks:** FSI data and Common European Framework research suggest rough hour ranges. If a learner claims B2 Spanish after 6 months of casual self-study (approximately 100--150 hours), flag this as likely overestimated and gently probe. A B2 in Spanish typically requires 500--600 guided hours minimum.
- **Error pattern analysis:** Ask the learner to write or dictate 3--5 sentences describing their week. Analyze for: article/gender errors (A2--B1 in Romance languages), tense consistency (B1 threshold), subordinate clause complexity (B2 threshold), register appropriateness (C1 threshold), idiomatic naturalness (C2 threshold).
- **Comprehension spot-check:** For the level they claim, ask them to describe the content of a specific type of authentic input. A claimed B2 French speaker should be able to summarize a Le Monde article headline and lede paragraph. A claimed B1 Spanish speaker should handle a TeleMundo news segment on a familiar topic.
- **Recency and decay:** Has the learner actively used the language in the past 6 months? Level decay is well-documented, particularly in speaking and listening. Add a decay discount of approximately 0.5 sub-levels for learners who have been inactive for 6+ months, 1 full level for 2+ year gaps.

### Step 5: Construct the Skill Profile

Synthesize the diagnostic data into a four-domain skill profile. Never report a single "level" without the profile breakdown -- this is the most actionable part of the assessment.

For each domain, assign:
- A primary level (A1, A2, B1, B2, C1, C2)
- A sub-level qualifier: **emerging** (just entering this level, less than 50% of descriptors met), **consolidating** (meeting 50--80% of descriptors), or **transitioning** (meeting 80%+ and ready to move up)

The **composite level** for practical purposes is the average of the four domain levels, but weighted by the learner's stated use case:
- Travel/tourism: weight Listening and Speaking 60%, Reading and Writing 40%
- Academic study: weight Reading and Writing 60%, Listening and Speaking 40%
- Professional/workplace: weight all four equally at 25%
- Heritage learner reconnection: weight Listening and Speaking more heavily due to typically stronger oral-aural foundation

Identify the **bottleneck skill** -- the single domain most limiting the learner's overall communicative competence. This becomes the top priority in the Next Steps section.

### Step 6: Identify Specific Micro-Level Gaps Within the Current Level

A level label alone is insufficient. For each domain, identify the specific structural and lexical gaps that are preventing advancement. This requires applying level-specific criteria:

**Vocabulary thresholds (research-based):**
- A1: ~500 word families (basic survival vocabulary)
- A2: ~1,000 word families (everyday topics)
- B1: ~2,000--3,000 word families (general communication without significant gaps)
- B2: ~4,000--5,000 word families (including abstract and academic vocabulary)
- C1: ~8,000--10,000 word families (low-frequency, formal, and literary vocabulary)
- C2: ~15,000--20,000 word families (near-native range)

**Grammar thresholds (illustrative for Spanish; adjust for target language):**
- A1--A2: present tense, basic past (preterite), ser/estar distinction, gender/number agreement
- B1: subjunctive introduction, imperfect vs preterite contrast, reflexive verbs, future tense
- B2: subjunctive in adverbial and relative clauses, conditional perfect, passive constructions, reported speech
- C1: fine register control, idiomatic conditionals, nominalization, discourse cohesion devices
- C2: stylistic variation, archaic or highly literary structures, colloquial contractions, sociolectal awareness

**Interaction quality thresholds:**
- B1: can sustain topic but relies on repetition requests and clarification strategies
- B2: repairs misunderstandings independently; maintains conversation across topic shifts
- C1: uses discourse markers and hedging for precision; adjusts register
- C2: indistinguishable from educated native speaker in most contexts; detects irony, implicature

### Step 7: Generate the Prioritized Study Prescription

Based on the skill profile and bottleneck skill, produce a concrete 90-day study prescription. The prescription must include:

- **Weekly hour commitment** -- minimum viable and recommended range based on CEFR advancement research (approximately 3--4 hours/week for slow progress, 7--10 hours/week for steady advancement, 15+ hours/week for accelerated advancement)
- **Domain priority allocation** -- specific percentage of study time per skill domain based on the identified profile and bottleneck
- **Input/output ratio** -- A1--B1 learners should spend approximately 70% of time on input (listening, reading) and 30% on output (speaking, writing); B2+ learners benefit from a 50/50 split as output practice drives accuracy consolidation
- **Specific resource categories** -- do not recommend generic "apps" or "websites"; specify resource types (graded readers at level N, native-speed podcasts on familiar topics, shadowing practice with scripted dialogue, conversation exchange with corrective feedback, structured writing with tutor correction)
- **Milestone checkpoint** -- specify what observable behaviors signal readiness to re-assess (e.g., "When you can read a newspaper article on a familiar topic with fewer than 5 unknown words per 100-word passage, reassess your reading level")

### Step 8: Deliver the Output and Invite Calibration

Present the full assessment report using the Output Format template. After delivery:

- Explicitly invite the learner to push back -- "Does this feel accurate? Where do you disagree?"
- If the learner disputes a level assignment, probe with one or two specific functional questions to either confirm or revise
- Note any areas of uncertainty in the assessment and explain what additional evidence would sharpen the estimate
- Confirm which complementary skill the learner should use next based on the prescription

---

## Output Format

```
## Language Level Assessment Report

**Language:** [Target language]
**Date of Assessment:** [Date]
**Assessment Method:** CEFR Self-Assessment Diagnostic with Reality-Check Calibration
**Learner Context:** [Native language(s) | Approximate study history | Learning context | Use case]

---

### Skill Profile

| Skill Domain | Estimated Level | Sub-Level Status | Confidence |
|-------------|----------------|-----------------|------------|
| Listening | [A1--C2] | Emerging / Consolidating / Transitioning | High / Medium / Low |
| Reading | [A1--C2] | Emerging / Consolidating / Transitioning | High / Medium / Low |
| Speaking | [A1--C2] | Emerging / Consolidating / Transitioning | High / Medium / Low |
| Writing | [A1--C2] | Emerging / Consolidating / Transitioning | High / Medium / Low |
| **Composite Level** | **[A1--C2]** | | |

**Primary Bottleneck Skill:** [Domain] -- [one-sentence explanation of what specifically is limiting progress]

---

### Self-Assessment Diagnostic

**Instructions:** For each skill, mark the highest tier where you can answer "yes with confidence" to ALL statements in that band.

#### Listening

- [ ] **A1** -- I can recognize familiar words and very basic phrases when people speak slowly and clearly
- [ ] **A2** -- I can understand the main point of short, clear messages on everyday topics (shopping, directions, simple instructions)
- [ ] **B1 (lower)** -- I can follow the main points of clear, standard speech on familiar topics delivered at normal speed
- [ ] **B1 (upper)** -- I can understand the main content of radio or podcast discussions on familiar topics; I can follow a story or film with visual support
- [ ] **B2 (lower)** -- I can understand extended speech on abstract and complex topics without major difficulty; I follow most TV news with full comprehension
- [ ] **B2 (upper)** -- I can follow fast, colloquial speech with occasional gaps; I understand most humor and indirect meaning in media
- [ ] **C1** -- I can understand extended speech even when delivery is fast and implicit; I rarely need repetition from native speakers
- [ ] **C2** -- I have no difficulty with any variety of spoken language, including rapid colloquial speech, heavy accents, and specialized discourse

#### Reading

- [ ] **A1** -- I can recognize familiar names, words, and very simple sentences (signs, menus, short instructions)
- [ ] **A2** -- I can read short, simple texts on familiar topics; I can find specific predictable information in everyday materials
- [ ] **B1 (lower)** -- I can understand texts written primarily in high-frequency language on topics of personal relevance
- [ ] **B1 (upper)** -- I can read straightforward factual texts or simple literary narratives; I can find and understand relevant information in articles
- [ ] **B2 (lower)** -- I can read and understand articles on contemporary issues; I can handle most general fiction and non-fiction
- [ ] **B2 (upper)** -- I can read complex texts fluently with only occasional dictionary use; I understand implicit meaning and authorial stance
- [ ] **C1** -- I can understand long, demanding texts including those beyond my specialization; I appreciate stylistic choices
- [ ] **C2** -- I read virtually all forms of written language, including abstract, structurally complex texts, without any difficulty

#### Speaking (Production and Interaction)

- [ ] **A1** -- I can use simple isolated phrases to introduce myself and describe immediate surroundings; I rely heavily on gestures
- [ ] **A2** -- I can handle short social exchanges and describe my background using simple connected phrases; I need slow, clear interlocutors
- [ ] **B1 (lower)** -- I can deal with most travel situations; I can sustain a simple conversation on familiar topics with predictable gaps
- [ ] **B1 (upper)** -- I can narrate events, describe experiences, and briefly explain opinions on familiar topics with reasonable fluency
- [ ] **B2 (lower)** -- I can interact with fluency and spontaneity; I can participate in discussions on general topics without strain
- [ ] **B2 (upper)** -- I can argue clearly for a point of view, discuss abstract topics, and handle unexpected conversational turns
- [ ] **C1** -- I can express ideas fluently and precisely; I use language flexibly and effectively for social, academic, and professional purposes
- [ ] **C2** -- I can express myself with precision, spontaneity, and naturalness, differentiating fine nuances of meaning

#### Writing

- [ ] **A1** -- I can write simple isolated phrases and short sentences (postcards, personal details on forms)
- [ ] **A2** -- I can write short, simple messages on familiar topics using simple connectors (and, but, because)
- [ ] **B1 (lower)** -- I can write straightforward connected text on familiar topics; I can write personal letters describing experiences
- [ ] **B1 (upper)** -- I can write clear, simple texts on familiar subjects; I can link ideas using a variety of connectors
- [ ] **B2 (lower)** -- I can write clear, detailed text on a wide range of subjects, explaining and defending viewpoints
- [ ] **B2 (upper)** -- I can write well-structured essays and reports; I synthesize information from multiple sources with appropriate hedging
- [ ] **C1** -- I can write complex, well-structured text on demanding topics, controlling length and organization flexibly
- [ ] **C2** -- I can write clear, smoothly flowing text in an appropriate style for any purpose; my errors are rare and minor

---

### CEFR Reference: Hours to Level (from Zero)

| Language Category | Example Languages | A2 | B1 | B2 | C1 |
|------------------|------------------|-----|-----|-----|-----|
| Category I (closely related to English) | Spanish, French, Italian, Portuguese, Romanian | 150 hrs | 350 hrs | 600 hrs | 950 hrs |
| Category II (some differences) | German, Indonesian, Malay, Swahili | 200 hrs | 450 hrs | 750 hrs | 1,100 hrs |
| Category III (significant differences) | Russian, Greek, Hindi, Turkish, Thai, Hebrew | 300 hrs | 600 hrs | 1,000 hrs | 1,500 hrs |
| Category IV (exceptional difficulty) | Arabic, Mandarin, Japanese, Korean, Cantonese | 400 hrs | 900 hrs | 1,500 hrs | 2,200+ hrs |

*Note: These are FSI-derived estimates for L1 English speakers in structured instruction. Self-study and immersion contexts produce different curves.*

---

### Identified Gaps by Domain

#### Listening Gaps
- [Specific gap 1 -- e.g., "Difficulty tracking connected speech at natural pace; individual words clear but elision and reduction cause comprehension drops"]
- [Specific gap 2]

#### Reading Gaps
- [Specific gap 1 -- e.g., "Low-frequency vocabulary above 2,000 word families creates significant reading interruption"]
- [Specific gap 2]

#### Speaking Gaps
- [Specific gap 1 -- e.g., "Tense consistency breaks down under real-time speaking pressure; planning time dependency"]
- [Specific gap 2]

#### Writing Gaps
- [Specific gap 1 -- e.g., "Discourse cohesion limited to basic connectors; argument structure is list-based rather than integrated"]
- [Specific gap 2]

---

### 90-Day Study Prescription

**Composite Level:** [Level]
**Primary Goal:** Advance [bottleneck skill] from [current sub-level] to [target sub-level]
**Recommended Weekly Hours:** [Minimum] -- [Recommended] hours/week

#### Time Allocation

| Domain | % of Study Time | Weekly Hours (at recommended level) | Priority Focus |
|--------|----------------|--------------------------------------|---------------|
| Listening | [%] | [hrs] | [specific focus, e.g., "natural-speed input on familiar topics"] |
| Reading | [%] | [hrs] | [specific focus, e.g., "graded readers at current level +0.5"] |
| Speaking | [%] | [hrs] | [specific focus, e.g., "structured conversation with error correction"] |
| Writing | [%] | [hrs] | [specific focus, e.g., "short paragraphs with tutor feedback"] |

#### Input/Output Ratio
**Recommended split:** [Input %] input (listening + reading) / [Output %] output (speaking + writing)
**Rationale:** [One sentence explaining why based on current level]

#### Resource Types by Domain

| Domain | Resource Type | Quantity/Frequency | Notes |
|--------|-------------|-------------------|-------|
| Listening | [e.g., graded audio dialogues at A2, short authentic clips at B1] | [e.g., 20 min/day] | [e.g., use transcripts for first 2 weeks] |
| Reading | [e.g., graded readers Level 2, selected news with simplified edition] | [e.g., 2 texts/week] | [e.g., timed reading for fluency] |
| Speaking | [e.g., iTalki tutor sessions with correction contract, language exchange] | [e.g., 2x/week 30 min] | [e.g., record for self-review] |
| Writing | [e.g., journaling with weekly tutor correction, structured paragraph tasks] | [e.g., 3x/week 15 min] | [e.g., focus on one grammar target per week] |

#### Level Advancement Milestones

| Domain | Milestone to Trigger Re-assessment |
|--------|------------------------------------|
| Listening | [Specific, observable behavior -- e.g., "Can follow 5-minute authentic audio on familiar topic with 80%+ comprehension without transcript"] |
| Reading | [Specific, observable behavior -- e.g., "Reads 200 words/minute with <5 unknown words per 100-word passage at [level] text"] |
| Speaking | [Specific, observable behavior -- e.g., "Sustains 10-minute conversation on unfamiliar topic without resorting to L1 or requesting repetition more than twice"] |
| Writing | [Specific, observable behavior -- e.g., "Writes 150-word connected paragraph with <3 structural errors on first draft"] |

---

### Complementary Skills -- Recommended Next Steps

| Immediate Priority | Timeline | Skill to Use |
|-------------------|----------|-------------|
| [e.g., Address writing bottleneck] | This week | `grammar-practice` |
| [e.g., Expand vocabulary at current level] | Ongoing | `vocabulary-building` |
| [e.g., Build immersive listening practice] | Within 2 weeks | `immersion-plan` |

---

### Calibration Notes
*Any caveats, areas of uncertainty, or factors that may have affected the accuracy of this assessment.*
- [e.g., "Speaking level self-estimate may be conservative -- learner reports high anxiety in performance contexts"]
- [e.g., "Reading level confidence is high based on provided text sample"]
```

---

## Rules

1. **Always assess all four CEFR skill domains separately** -- never assign a single undifferentiated level. Skill profiles are almost always uneven, and collapsing to one number obscures the most actionable diagnostic information.

2. **Apply the reality-check matrix in Step 4 before confirming any level** -- self-reported levels are systematically biased. Intermediate learners (B1--B2) tend to overestimate; beginners (A1--A2) tend to underestimate because A1 sounds "too basic." Neither impression should override the evidence.

3. **Hours-to-level data must inform the calibration** -- if a learner claims B2 in a Category IV language after 300 hours of study, this is statistically implausible (B2 requires 1,500+ hours). Flag the discrepancy gently and probe for confounding factors (heritage exposure, prior cognate language, intensive immersion).

4. **Never use a single can-do tier to assign a level** -- always use the "highest tier where ALL statements are confidently met" rule. A learner who can do three out of four B2 reading descriptors is B1 transitioning, not B2. Premature level assignment causes learners to study at the wrong difficulty and stagnate.

5. **The bottleneck skill drives the prescription, not the strongest skill** -- communicative competence is gated by the weakest link in a learner's profile. A learner with C1 reading but B1 speaking cannot function at C1 in real interactions. The prescription must prioritize closing the gap, not expanding the strength.

6. **Language-specific calibration is mandatory** -- CEFR levels are linguistically universal but cognitively different across languages. A B2 in French is approximately 600 hours of work from zero for an English speaker; B2 in Mandarin is approximately 1,500 hours. Mixing these baselines produces severely inaccurate estimates.

7. **Sub-level granularity (emerging/consolidating/transitioning) must be preserved in the output** -- reporting "B1" without sub-level status omits the most time-sensitive information. A learner who is B1-transitioning should be studying near-B2 input; a B1-emerging learner still needs core B1 materials.

8. **The study prescription must include specific observable milestones** -- "study more listening" is not a milestone. The milestone must specify a measurable performance criterion (text length, speed, error frequency, comprehension percentage) tied to a re-assessment trigger.

9. **Do not conflate CEFR levels with exam score equivalencies unless directly relevant** -- B2 is not "equivalent to IELTS 6.5" for the purposes of this diagnostic. Exam-score translation introduces misleading precision because exams test a specific task format, not general communicative competence. Redirect exam-specific questions to `certification-prep`.

10. **Heritage learners and highly asymmetric learners require explicit caveats** -- a heritage Spanish speaker raised in an English-dominant household may have native-level listening comprehension but A2-level writing. Their composite level is not B1; they have a bimodal profile that requires a specialized prescription. Flag this clearly rather than averaging the extremes.

---

## Edge Cases

**Learner reports extreme skill asymmetry (e.g., C1 reading, A2 speaking)**

This profile is common among academic learners of classical languages, self-taught readers, or learners who completed years of grammar-translation instruction without speaking practice. Do not average to B1/B2 -- this obscures critical information. Report the profile as genuinely asymmetric, explain that this is a well-documented pattern in formal instruction contexts, and weight the prescription heavily toward the deficit skill (speaking/listening). Note that catching up oral production from a high reading base is actually faster than building from scratch because vocabulary and grammar knowledge already exist -- what is needed is articulatory automaticity and real-time processing practice, not more input processing.

**Learner has had significant inactivity (1+ year gap)**

Level decay is not uniform. Passive skills (reading, listening) decay more slowly than productive skills (speaking, writing), especially for learners who had reached B2+. Reading level typically decays by roughly one sub-level per year of inactivity; speaking can decay by a full level or more. In the diagnostic, apply a conservative decay correction: reduce self-reported productive skills by one sub-level for a 1-year gap, and note that reassessment should occur again in 6--8 weeks after reactivation, as dormant skills return faster than original acquisition (reconstruction is faster than first acquisition). Prescribe "reactivation input" -- familiar content at the learner's pre-gap level to restore passive vocabulary access -- before introducing new material.

**Learner is a heritage speaker with non-standard dialect exposure**

Heritage speakers often have strong oral phonology and listening comprehension for colloquial registers but weak formal/written register, limited literacy, and significant grammatical gaps in formal structures (subjunctive, complex subordination). Their CEFR profile may be B2+ in informal listening but A2 in formal writing. Standard CEFR can-do descriptors do not fully capture this -- note explicitly in the Calibration Notes that the assessment may undervalue communicative competence in informal contexts and overvalue it in formal ones. The prescription should address formal register and literacy specifically, not treat the learner as a typical B1 beginner.

**Learner is a very young child or early teenager (under 14)**

Standard CEFR can-do descriptors assume adult cognitive development and adult real-world contexts (banking, traveling, professional settings). For learners under 14, use age-appropriate analogues: instead of "I can handle most situations while traveling," use "I can understand instructions in class given by the teacher at normal speed." The core CEFR levels still apply but the descriptor language must be adjusted. Note this adjustment explicitly in the output so the learner or parent understands the modification.

**Learner claims to be C1 or C2 but cannot provide any supporting evidence**

C2 is exceptionally rare -- it represents near-native competence including near-perfect control of stylistic register, colloquial naturalness, and pragmatic subtlety. C1 is genuinely advanced -- most successful university language graduates reach B2 to C1 after 4 years of study. Gently challenge C1/C2 self-reports with the boundary-probing questions from Step 3. Specific probes for C1 verification: "Explain the difference between two near-synonyms in the target language." "Produce a short formal complaint letter on the spot." If the learner cannot meet these criteria, revise down to B2-transitioning and explain the distinction clearly -- this is information that helps them, not a judgment.

**Target language uses a non-Latin script (Arabic, Japanese, Korean, Chinese, Thai, Russian, etc.)**

Script competence must be assessed separately from communicative competence. A learner may be B1 in spoken Mandarin (Putonghua) but A1 in reading simplified characters -- these are genuinely decoupled skills in logographic writing systems. For Japanese specifically, three scripts are involved (hiragana, katakana, kanji), and a B1 conversational speaker may have fewer than 300 kanji -- far short of the 2,000 required for unrestricted reading. Add a dedicated script proficiency note to the Reading domain and report it distinctly. For Arabic, distinguish Modern Standard Arabic (MSA) proficiency from spoken dialect proficiency -- many learners have the reverse of the typical pattern (dialect competence from family, MSA weakness from limited formal instruction).

**Learner is studying multiple languages simultaneously**

Simultaneous multilingual learners commonly experience cross-linguistic interference, particularly between typologically similar languages studied in parallel (Spanish and Italian, German and Dutch). Their self-assessment may reflect interference as errors they attribute to deficiency when they may actually be at a higher base level with transfer suppression. Note the simultaneous study context in the calibration section, probe specifically for confusion between the target language and the interfering language, and be conservative with downward level corrections -- what appears as a gap may be temporary transfer interference that resolves with explicit attention.

---

## Example

**Input:**
"I've been studying Spanish for about two years. I took one semester of Spanish in college six years ago, then stopped, and picked it up again 18 months ago using self-study -- mostly apps, some YouTube, and I've had about 10 iTalki sessions with tutors. I'm a native English speaker. I can read pretty well but I freeze up when speaking. I'm not sure if I'm B1 or B2. I want to eventually work in healthcare settings with Spanish-speaking patients."

---

**Output:**

## Language Level Assessment Report

**Language:** Spanish
**Date of Assessment:** [current date]
**Assessment Method:** CEFR Self-Assessment Diagnostic with Reality-Check Calibration
**Learner Context:** Native English (L1) | Approximately 1 semester college (100 hrs est.) + 18 months active self-study (est. 250--350 hrs active study) = est. 350--450 total hours | Self-study with periodic tutoring | Professional healthcare use

---

### Skill Profile

| Skill Domain | Estimated Level | Sub-Level Status | Confidence |
|-------------|----------------|-----------------|------------|
| Listening | B1 | Transitioning | Medium |
| Reading | B2 | Emerging | High |
| Speaking | B1 | Emerging | Medium-High |
| Writing | B1 | Consolidating | Medium |
| **Composite Level** | **B1+** | Uneven profile -- reading ahead of other skills | |

**Primary Bottleneck Skill:** Speaking -- learner reports freezing under real-time pressure; gap between receptive processing capacity (B2 reading) and productive automaticity (B1 emerging speaking) is the core limitation for healthcare communication goal.

---

### Key Diagnostic Findings

**Hours-to-level reality check:** At approximately 350--450 total hours with an English L1 background, a B1+ composite level is entirely consistent with FSI benchmarks for Spanish (B1 threshold is approximately 350 hours; B2 requires approximately 600 hours). The reading advantage is explained by the heavy app and YouTube consumption pattern, which trains comprehension more than production. This is not a deficit -- it is a predictable outcome of the specific study diet.

**The six-year gap:** The original college semester (A2-level instruction) would have decayed substantially. However, the 18 months of reactivation have clearly rebuilt well beyond that base. The gap is not currently a concern -- treat the learner as if the prior six years did not occur, with a note that reconstruction has already happened.

**Healthcare context implication:** Healthcare Spanish demands register precision that standard B2 general Spanish does not guarantee. Medical terminology (symptoms, body parts, procedures, medication instructions), imperative constructions for patient instructions, and active listening under high-stakes conditions will need targeted overlay on top of general B1/B2 competence. This is flagged for the prescription.

---

### Self-Assessment Diagnostic Results

*Based on responses and probe questions during this session:*

#### Listening: B1 Transitioning

The learner meets all B1 descriptors confidently -- follows standard-speed conversation on familiar topics, can follow narrative podcasts with occasional replay, follows tutors without difficulty. The upper B1 descriptor (follows radio/podcast discussion on familiar topics) is met. The lower B2 descriptor (follows extended speech on abstract topics without major difficulty) is partially met on familiar topics but breaks down on abstract or unfamiliar content. **Assessment: B1 Transitioning -- ready for targeted B2 input.**

#### Reading: B2 Emerging

Strong performance reported. Reads news articles on familiar topics with minimal dictionary use. Can follow narrative fiction at high-frequency vocabulary level. Struggles with academic or formal register text where vocabulary density is high. Cannot yet confidently read medical or technical Spanish without significant lookup. **Assessment: B2 Emerging -- consolidating at lower B2, with a specific gap in specialist/formal vocabulary.**

#### Speaking: B1 Emerging

This is the critical finding. Self-report of "freezing" is consistent with the transition zone between proceduralized A2/lower-B1 grammar and the more fluid B1 mid-level. Learner can produce accurate sentences with planning time but real-time production pressure triggers avoidance and repetition. Error patterns reported by tutors center on ser/estar under pressure, subjunctive avoidance, and preterite/imperfect confusion in fast speech. These are classic B1 consolidation-phase errors. **Assessment: B1 Emerging -- within B1 but below the midpoint; speaking is approximately one full level behind reading.**

#### Writing: B1 Consolidating

Can write connected paragraphs with reasonable accuracy. Uses a variety of connectors beyond simple "y/pero." Makes errors on subjunctive in writing but can self-correct with time. Has not practiced formal healthcare-style writing (patient instructions, brief documentation). **Assessment: B1 Consolidating.**

---

### Identified Gaps by Domain

#### Listening Gaps
- Extended abstract or unfamiliar-topic audio at B2 level -- learner processing is topic-dependent rather than fully level-generalized
- Fast colloquial speech with regional accent variation (Latin American regional accents, Spanish Castilian) -- tutors have likely been accommodating speech rate
- Healthcare-specific listening: patient symptom description, fast medical team communication

#### Reading Gaps
- Formal and specialist register vocabulary above the 4,000 word-family mark -- healthcare, legal, administrative registers
- Ability to infer meaning from morphological analysis (recognizing that "hipertensivo" relates to "tensión" and "hiper-") -- important for medical vocabulary acquisition
- Reading speed needs improvement for functional clinical use -- likely below 150 words/minute in Spanish vs. likely 250+ in English

#### Speaking Gaps
- Proceduralization of core B1 grammar under time pressure -- ser/estar, preterite/imperfect, and subjunctive avoidance are all accuracy gaps that become fluency gaps under real-time conditions
- Transition phrase and filler vocabulary in Spanish ("o sea," "es decir," "a ver," "bueno") -- lack of these creates unnatural pause patterns
- Healthcare-specific interaction scripts: taking patient history, explaining procedures, giving instructions, expressing empathy
- Self-repair and communication strategy vocabulary -- how to say "let me rephrase," "I meant to say," "could you repeat that please" in Spanish

#### Writing Gaps
- Subjunctive in subordinate clauses -- avoidable in speech but expected in formal writing at B2+
- Healthcare documentation register -- imperative constructions, passive voice for procedures, formal address

---

### 90-Day Study Prescription

**Composite Level:** B1+ (Uneven: Reading B2-Emerging, other skills B1)
**Primary Goal:** Advance Speaking from B1-Emerging to B1-Transitioning, with targeted healthcare Spanish overlay
**Recommended Weekly Hours:** Minimum 5 hours/week -- Recommended 8--10 hours/week

#### Time Allocation

| Domain | % of Study Time | Weekly Hours (at 8 hrs/week) | Priority Focus |
|--------|----------------|-------------------------------|---------------|
| Speaking | 40% | 3.2 hrs | Real-time production under pressure; healthcare interaction scripts |
| Listening | 25% | 2.0 hrs | Abstract and unfamiliar topics; regional variety exposure |
| Reading | 20% | 1.6 hrs | Healthcare/medical vocabulary; speed training |
| Writing | 15% | 1.2 hrs | Subjunctive in writing; short paragraph structuring |

#### Input/Output Ratio
**Recommended split:** 45% input / 55% output
**Rationale:** At B1+ with a documented output deficit, the learner has sufficient input-processing capacity -- the priority is driving proceduralization through high-volume output practice, not more passive comprehension. The reading advantage already provides strong input scaffolding.

#### Resource Types by Domain

| Domain | Resource Type | Quantity/Frequency | Notes |
|--------|-------------|-------------------|-------|
| Speaking | Weekly iTalki sessions with explicit healthcare script focus; conversation exchange with Spanish-speaking healthcare colleague or student | 2--3x/week, 30 min each | Set explicit correction contract with tutor: request real-time flagging of ser/estar and subjunctive errors. Record at least one session per week for self-review |
| Speaking | Shadowing practice with medical Spanish dialogues (patient intake scenarios, symptom description scripts) | 15 min/day, 5 days/week | Use scripted dialogue first, then move to improvised variation |
| Listening | Authentic Spanish-language medical content: patient education videos, health news segments from Univision or RTVE | 20--30 min/day | Begin with transcripts + audio simultaneously; remove transcript after 2 passes |
| Listening | Regional variety exposure: alternate between Mexican Spanish, Argentine Spanish, and Castilian sources over the 90 days | 3 sources/week | Builds accent robustness needed for diverse patient populations |
| Reading | Medical Spanish glossary work: systematic study of the top 500 most common medical terms using a flashcard system (Anki recommended) | 15 min/day | Prioritize morphological roots (Latin/Greek) for generative vocabulary |
| Reading | Timed reading of 300-word general Spanish texts -- aim to increase processing speed from estimated 130 words/min to 180+ | 2x/week | Track words per minute explicitly |
| Writing | Weekly paragraph writing (150 words) on healthcare scenario prompt (explain a medication schedule, describe patient symptoms) with tutor correction | 1x/week | Focus correction contract on subjunctive and formal register |

#### Level Advancement Milestones

| Domain | Milestone to Trigger Re-assessment |
|--------|------------------------------------|
| Speaking | Sustains 15-minute role-play patient intake conversation without pausing more than 5 seconds or switching to English; makes fewer than 3 uncorrected ser/estar errors per session |
| Listening | Follows 10-minute authentic medical Spanish patient-education video (standard register) with 80%+ comprehension without transcript |
| Reading | Reads a 400-word authentic healthcare leaflet in Spanish (standard register) with fewer than 8 unfamiliar words and comprehends the core instruction set |
| Writing | Writes a 150-word patient instruction paragraph in Spanish (how to prepare for a procedure) with fewer than 2 structural errors on first draft |

**Target re-assessment timeline:** 10--12 weeks at recommended study pace. Expect Speaking to reach B1-Consolidating and Reading to reach B2-Consolidating by that point if prescription is followed.

---

### Complementary Skills -- Recommended Next Steps

| Immediate Priority | Timeline | Skill to Use |
|-------------------|----------|-------------|
| Address subjunctive avoidance in speaking and writing | This week | `grammar-practice` -- request targeted subjunctive drills for B1 level, present and imperfect subjunctive |
| Build medical Spanish vocabulary systematically | Ongoing | `vocabulary-building` -- request healthcare domain vocabulary list with frequency data |
| Develop immersive input environment | Within 2 weeks | `immersion-plan` -- request a B1+ Spanish immersion schedule with healthcare media integration |

---

### Calibration Notes

- **Speaking level confidence: Medium-High.** Self-report of "freezing" is a reliable indicator of B1-Emerging productive level; this is one of the most commonly reported transitions and it correlates well with the specific error patterns described (ser/estar under pressure, subjunctive avoidance). The estimate would be upgraded to High confidence with a recorded speaking sample.
- **Reading level confidence: High.** The pattern of strong reading relative to production in app-and-YouTube-based self-study is well-documented. B2-Emerging reading at approximately 350--450 total hours is slightly above the FSI average curve for self-study, suggesting the learner has a natural aptitude for reading acquisition or has chosen particularly high-quality reading-intensive materials.
- **Healthcare overlay note:** Reaching functional healthcare Spanish competence requires B2 general proficiency AND approximately 60--80 hours of domain-specific vocabulary and interaction script training on top of general B2. The current B1+ foundation is solid -- the learner is approximately 200 hours of targeted study away from functional healthcare communication competence at the B2 level.
- **Reassessment recommended in:** 10--12 weeks
