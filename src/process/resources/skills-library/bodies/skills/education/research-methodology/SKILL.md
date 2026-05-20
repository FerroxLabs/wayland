---
name: research-methodology
description: |
  Compares research methodologies and helps learners select the most appropriate method for their research question. Produces a methodology comparison with rationale for selection -- not a textbook chapter on research methods.
  Use when a learner asks to choose a research method, compare qualitative vs quantitative approaches, select a research design, or justify their methodology choice.
  Do NOT use for developing a research question (use `research-question`), for data collection instrument design (use `data-collection-plan`), or for statistical analysis (not an education skill).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "research academic-writing study-skills step-by-step"
  category: "education"
  subcategory: "academic-skills"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Research Methodology

## When to Use

Use this skill when a learner needs help selecting, comparing, or justifying a research methodology for an academic or applied research project. Specific trigger scenarios:

- A learner has a research question (already developed) and asks which methodology fits best -- for example, "Should I use a survey or interviews for my study on student burnout?"
- A learner is writing a dissertation methodology chapter and needs to justify why they chose qualitative over quantitative approaches
- A learner must choose between two or more methods (e.g., case study vs. ethnography, experiment vs. quasi-experiment) and cannot determine which is more appropriate
- A learner's supervisor or committee has questioned their methodology choice and they need to build a stronger rationale
- A learner is designing a mixed-methods study and needs help sequencing or integrating the qualitative and quantitative strands
- A learner in a research methods course needs to complete a methodology comparison assignment with a justified selection
- A learner is switching from one disciplinary tradition (e.g., psychology to education) and needs to understand how methodological norms differ

**Do NOT use when:**

- The learner does not yet have a research question -- direct them to the `research-question` skill first; methodology selection is meaningless without a settled question
- The learner needs to design specific data collection instruments (interview protocols, survey scales, observation rubrics) -- use the `data-collection-plan` skill
- The learner is asking how to analyze data (run a regression, conduct thematic analysis, calculate inter-rater reliability) -- this is outside education skills and belongs to a statistical or qualitative analysis skill
- The learner is asking for help writing the methodology chapter prose, not selecting or justifying the method -- this is a writing task, not a methodology comparison task
- The learner is an educator designing a research methods curriculum -- this is a teaching design task, use the curriculum or lesson-planning subcategory
- The learner's question is purely about epistemological or philosophical frameworks with no applied research project in view -- this is a philosophy of knowledge task, not a methodology selection task
- The learner needs help with a systematic literature review protocol (PRISMA, PICO) -- that is a specialized review methodology with its own skill

---

## Process

### Step 1: Establish the Research Context

Before recommending any methodology, collect the information that drives the decision. Ask the learner to provide (or extract from what they have shared):

- **The research question in full** -- not a topic, but the actual question, including any sub-questions. If the question is not yet precise, pause and address this before continuing; methodology cannot be selected for a vague question.
- **The research purpose** -- is the study exploratory (little prior work exists), descriptive (documenting a phenomenon), explanatory (testing why something happens), or evaluative (assessing a program or intervention)?
- **The epistemological stance** -- does the learner's discipline or institution expect positivist, interpretivist, constructivist, pragmatist, or critical/transformative assumptions? Many learners won't know this term; ask instead: "Does your field expect numerical data and statistical analysis, or narrative and thematic analysis, or both?"
- **Practical constraints** -- sample access (can they reach 200 participants or only 12?), timeline (weeks vs. years), budget, ethical approval requirements, and whether data collection has already begun
- **Disciplinary norms** -- what field is this? Methods that are standard in health sciences (RCTs, cross-sectional surveys) may be unusual in education or anthropology
- **Prior work in the area** -- has the learner done a literature review? What methods dominated that literature? Replication studies must match prior methods; critical extensions may deliberately diverge

### Step 2: Classify the Research Question by Type

Map the research question to one of six canonical question types. This is the single most important decision driver:

- **Type 1 -- Causal/Explanatory:** "Does X cause Y?" or "What is the effect of X on Y?" -- these questions require experimental or quasi-experimental designs; correlational methods cannot answer them
- **Type 2 -- Relational/Predictive:** "What is the relationship between X and Y?" or "Does X predict Y?" -- these questions suit cross-sectional surveys with correlational or regression analysis, or longitudinal cohort designs
- **Type 3 -- Descriptive/Prevalence:** "How widespread is X?" or "What are the characteristics of X?" -- these questions suit surveys with large random or representative samples, or systematic observation studies
- **Type 4 -- Experiential/Interpretive:** "How do people experience X?" or "What does X mean to participants?" -- these questions require qualitative methods: phenomenology, grounded theory, narrative inquiry, or interpretive description
- **Type 5 -- Contextual/Process:** "How does X work in this specific context?" or "Why did X happen in this case?" -- these questions suit case study, ethnography, or process tracing
- **Type 6 -- Improvement/Action:** "How can we improve X in this setting?" -- these questions suit action research or design-based research

If the question spans two types (e.g., both relational and experiential), flag the need for mixed methods before proceeding to Step 3.

### Step 3: Map Candidate Methodologies

For the identified question type(s), generate a shortlist of two to four candidate methodologies. Do not present all eight or ten possible methods -- that overwhelms learners without guiding them. The shortlist should include:

- The most commonly used methodology for this question type in the learner's discipline
- The strongest alternative that addresses the same question from a different paradigm
- If applicable, a mixed-methods design that integrates both

For each candidate methodology, identify:
- **Paradigm:** positivist/post-positivist, interpretivist/constructivist, pragmatist, or critical/transformative
- **Typical sample size range:** not as a rule but as a benchmark -- e.g., phenomenological interviews typically involve 6-25 participants; survey studies typically require 100+ for adequate statistical power; ethnography involves extended presence with a community rather than a defined n
- **Data form:** numerical/structured, textual/narrative, observational/artifact-based, or mixed
- **Time horizon:** cross-sectional (one point in time), longitudinal (repeated measures over months or years), or embedded (researcher present in the field over weeks to years)
- **Generalizability expectation:** statistical generalization (probability samples), analytical/theoretical generalization (transferability to similar contexts), or thick description (no generalization claimed)

### Step 4: Apply the Decision Framework

Walk the learner through a structured decision process using three filters:

**Filter 1 -- Ontological/Epistemological fit:** Does the methodology assume a single objective reality that can be measured (post-positivist), or multiple constructed realities that must be interpreted (constructivist), or both? The research question's nature reveals which assumption is appropriate. A question asking "how many students experience anxiety" assumes a measurable phenomenon; a question asking "what does anxiety feel like for first-generation students" assumes a lived, constructed experience.

**Filter 2 -- Feasibility fit:** Apply these thresholds --
- Sample access below 30 participants: eliminate large-scale survey designs; lean toward qualitative or small-N mixed methods
- Timeline under 3 months: eliminate ethnography (minimum 6-12 months of fieldwork for credible ethnographic work), longitudinal designs, and multi-phase mixed methods
- No control over participant assignment: eliminate true experimental designs; quasi-experimental or observational designs become the ceiling
- Sensitive populations or sensitive topics: qualitative designs with purposive sampling are often more ethical than large anonymous surveys; IRB/ethics board considerations apply

**Filter 3 -- Disciplinary convention fit:** Methodologies carry prestige and legitimacy differently across fields:
- In psychology and medicine, experimental > quasi-experimental > survey > qualitative in perceived rigor
- In education, mixed methods and action research are increasingly central; qualitative designs carry full methodological legitimacy
- In sociology and anthropology, ethnography and grounded theory are prestige methods
- In nursing and allied health, interpretive description and phenomenology are well-established
- In political science, comparative case study and process tracing are standard; experiments are growing
- In business research, surveys dominate quantitative work; grounded theory dominates qualitative work

If the learner's choice conflicts with disciplinary convention, name that conflict explicitly and help them either defend the deviation or reconsider.

### Step 5: Build the Methodology Comparison Table

Produce a structured comparison of the shortlisted methodologies (two to four) using the output format defined below. The table must include:

- Methodology name and paradigm
- Alignment with the specific research question (not generic)
- Typical sample/scope for this context
- Required data collection approach
- Analytic approach
- Key strength as applied to this question
- Key limitation as applied to this question
- Feasibility rating for this learner's constraints (High / Medium / Low with a one-sentence reason)

Generic tables copied from textbooks are not acceptable. Every cell must reference the learner's specific research question, context, or constraints.

### Step 6: Produce the Methodology Selection and Rationale

After the comparison table, make a clear recommendation:

- **State the selected methodology by name** -- do not hedge with "either could work equally well" unless mixed methods integration is the genuine recommendation
- **Write a four-part rationale** tied to the learner's specific research question:
  1. Question-method fit: why this question type requires this methodology
  2. Epistemological alignment: why the assumptions of the method match the nature of the phenomenon
  3. Feasibility alignment: how the method fits the learner's practical constraints
  4. Disciplinary legitimacy: how this selection will be received by the learner's committee, field, or publication venue
- **Name the strongest alternative** and explain specifically why it was not selected
- **Identify the design variant** within the methodology (e.g., within phenomenology: descriptive/Husserlian vs. interpretive/Heideggerian vs. IPA; within case study: single instrumental, multiple comparative, embedded)

### Step 7: Anticipate Methodology Chapter Challenges

After delivering the comparison and recommendation, proactively identify the two or three hardest methodological challenges the learner will face in their methodology chapter or proposal defense:

- What philosophical objection will arise (e.g., "How do you justify the lack of generalizability?")
- What practical criticism will arise (e.g., "Your sample is too small to reach theoretical saturation")
- What internal consistency problem might arise (e.g., "Your research question is interpretive but you proposed a survey -- that's a mismatch")

For each challenge, provide a one- to two-sentence pre-emptive defense the learner can use in their writing or defense.

### Step 8: Connect to Next Steps

Link the methodology selection to the skills and tasks that follow:

- If the learner now needs to design their data collection instrument, direct them to the `data-collection-plan` skill
- Identify whether their selected methodology has a canonical quality criterion they must address in writing (trustworthiness criteria for qualitative work -- credibility, transferability, dependability, confirmability; validity and reliability for quantitative; rigor and integration for mixed methods)
- Name one or two seminal methodological texts or theorists the learner should cite to establish legitimacy for their chosen approach (e.g., Creswell and Poth for qualitative, Shadish, Cook, and Campbell for experimental and quasi-experimental, Yin for case study, Morse for qualitative rigor)

---

## Output Format

```
## Methodology Comparison and Selection

**Learner's Research Question:** [Full question as stated or clarified]
**Research Purpose:** [Exploratory / Descriptive / Explanatory / Evaluative]
**Question Type:** [Type 1-6 as classified in Step 2]
**Discipline/Field:** [Field and level -- e.g., graduate education research]
**Key Constraints:** [Sample size, timeline, access, ethics]

---

### Candidate Methodology Comparison

| Criterion | [Methodology A] | [Methodology B] | [Methodology C if applicable] |
|-----------|----------------|----------------|-------------------------------|
| **Paradigm** | | | |
| **Fit with this research question** | | | |
| **Typical scope/sample for this context** | | | |
| **Data collection approach** | | | |
| **Analytic approach** | | | |
| **Key strength for this study** | | | |
| **Key limitation for this study** | | | |
| **Feasibility for this learner** | High/Med/Low -- reason | High/Med/Low -- reason | High/Med/Low -- reason |

---

### Recommended Methodology: [Name]
**Design variant:** [Specific design within the methodology]

#### Rationale

**1. Question-method fit:**
[2-3 sentences explaining why this question type requires this methodology -- specific to the learner's question]

**2. Epistemological alignment:**
[2-3 sentences explaining the ontological and epistemological assumptions of the method and why they match the phenomenon being studied]

**3. Feasibility alignment:**
[2-3 sentences connecting the method's requirements to the learner's specific constraints -- sample size, timeline, access]

**4. Disciplinary legitimacy:**
[2-3 sentences explaining how this choice will be received in the learner's field, what precedents exist, whose work it aligns with]

---

### Alternative Considered: [Name]
**Why not selected:** [3-4 specific sentences -- not generic limitations but specific mismatches with this learner's question and context]

---

### Anticipated Methodology Challenges

| Challenge | Pre-emptive Defense |
|-----------|---------------------|
| [Philosophical objection] | [One-to-two sentence response] |
| [Practical criticism] | [One-to-two sentence response] |
| [Internal consistency concern] | [One-to-two sentence response] |

---

### Quality Criteria for Selected Methodology
[List the applicable criteria -- e.g., credibility, transferability, dependability, confirmability for qualitative; internal/external validity, reliability for quantitative; rigor and integration for mixed]

### Foundational Citations to Establish Methodological Legitimacy
- [Author, work, and one-sentence description of why this citation establishes credibility for the selected method]
- [Author, work, and one-sentence description]

---

### Next Steps
1. [Immediate: e.g., confirm IRB/ethics requirements for selected method]
2. [Short-term: e.g., read the recommended foundational text to strengthen justification]
3. [Next skill: e.g., use data-collection-plan skill to design your interview protocol]
```

---

## Rules

1. **Never recommend a methodology before classifying the research question type** -- the question type is the primary decision driver; skipping it produces unreliable recommendations based on superficial pattern-matching.

2. **Never present a single methodology in isolation** -- always compare at least two candidates so the learner understands why the selected method is chosen over real alternatives, not just described in the abstract.

3. **Generic methodology descriptions are prohibited** -- every cell in the comparison table and every sentence in the rationale must reference the learner's specific research question, field, or constraints. If you catch yourself writing "interviews are good for exploring lived experiences" without tying it to this learner's question, rewrite it.

4. **Do not select experimental design when the learner has no control over assignment** -- a study without random assignment or a control condition is a quasi-experimental design at best, and more often a correlational study. Mislabeling it as an "experiment" is a common, serious error that will fail dissertation defense.

5. **Never conflate method and methodology** -- methodology is the philosophical framework and rationale (e.g., phenomenology, grounded theory, case study); method is the data collection technique (e.g., semi-structured interviews, observation, survey). A survey is a method; a cross-sectional descriptive study is a methodology. Maintain this distinction in all output.

6. **Do not allow the learner to justify methodology based on convenience alone** -- "I'm using interviews because I couldn't get enough survey respondents" is not a methodological rationale. Help the learner reframe convenience constraints within a legitimate epistemological argument, or flag that the constraint may compromise the study.

7. **Mixed methods requires integration, not just collection of both data types** -- a study that collects numbers and words but never integrates them is not a mixed-methods study; it is two separate weak studies. If recommending mixed methods, specify the integration strategy: convergent parallel (collecting simultaneously, comparing), explanatory sequential (quantitative first, qualitative to explain results), or exploratory sequential (qualitative first, quantitative to test or generalize).

8. **Sample size guidance must be methodology-specific, not universal** -- for quantitative power analysis: 80% power at α = 0.05 with a medium effect size (d = 0.5) requires approximately 64 participants per group in a two-group comparison. For phenomenological interviews: 6-25 participants for Husserlian or IPA approaches, with data saturation (no new themes emerging) as the stopping criterion, typically reached between 12-20 for homogeneous samples. For grounded theory: theoretical saturation typically requires 20-40 interviews. For case study: Yin recommends a minimum of four to six cases for multiple-case designs seeking literal or theoretical replication.

9. **Always name the specific design variant** -- "qualitative research" is not a methodology. Within qualitative traditions: phenomenology (descriptive or interpretive/IPA), grounded theory (Straussian or constructivist/Charmaz), narrative inquiry, case study, ethnography, and interpretive description are distinct methodologies with different purposes, sampling logics, and analytic procedures. Require specificity.

10. **Flag paradigm mismatches as errors, not preferences** -- if a learner's research question is clearly interpretive ("how do teachers make sense of inclusion policy?") but they propose a positivist survey design, this is a methodological error that will be flagged in peer review or committee review. Do not present it as "a valid alternative approach." Name the mismatch, explain why it matters, and help the learner resolve it.

---

## Edge Cases

### The Learner's Research Question Is Still Too Vague

If the learner presents a topic rather than a question (e.g., "I'm researching student motivation"), methodology selection cannot proceed. Ask the learner to complete the sentence: "This study investigates whether/how/what/to what extent [phenomenon] [relationship or experience] among [population] in [context]." If they cannot complete it, redirect to the `research-question` skill before returning here. Do not generate a methodology comparison for a topic -- the output will be meaningless and may actively mislead the learner by anchoring them to a method before the question is settled.

### The Learner Has Already Collected Data and Needs to Justify the Methodology Retrospectively

This occurs in practice-based research, pilot studies, or when learners begin data collection before completing their proposal. The approach shifts: work backward from what was actually collected (data form, sample size, collection method) to identify which methodology that data can legitimately support, and build the rationale from there. Do not pretend a decision was made prospectively if it was not. Help the learner write an honest account of how the design emerged -- this is acceptable in action research and interpretive traditions. Flag if the retrospective methodology cannot be coherently defended (e.g., a 6-person convenience sample cannot support a cross-sectional survey claim, but it can support a multi-case case study or phenomenological inquiry if the data is rich enough).

### The Learner's Discipline Has Very Narrow Methodological Norms

Some fields have near-universal methodological consensus: clinical medicine expects RCTs for effectiveness questions; mainstream experimental psychology expects lab experiments; economics expects econometric modeling. A learner in these fields who proposes qualitative methods may face committee opposition regardless of whether the choice is intellectually justified. Handle this carefully: acknowledge the disciplinary norm, help the learner assess whether they are challenging it intentionally (which requires a stronger rationale and possibly a different committee) or unintentionally (in which case alignment may be advisable). Do not dismiss the disciplinary norm as mere conservatism -- it reflects real epistemological commitments that define what counts as knowledge in that field.

### The Learner Is Proposing a Mixed-Methods Design Prematurely

Mixed methods is often chosen by learners who want to appear thorough rather than because the research question genuinely requires integration. Signs of premature mixed-methods: the learner cannot state what the quantitative strand will tell them that justifies the qualitative strand (or vice versa), or the "integration" amounts to presenting two sets of results side by side. Challenge the learner with: "What decision or insight requires both forms of data that neither form could provide alone?" If they cannot answer, recommend the stronger single-paradigm design. A well-executed qualitative or quantitative study is stronger than a poorly integrated mixed-methods study.

### The Learner Is Working in a Critical or Transformative Paradigm

Action research, participatory action research (PAR), feminist methodology, and critical race methodology operate under different quality criteria and different purposes than post-positivist or constructivist research. These methodologies explicitly foreground researcher positionality, power dynamics, and a change agenda. If the learner's question includes a social justice or emancipatory aim ("How can community members use research to challenge housing displacement?"), identify the critical paradigm and explain that quality criteria here include trustworthiness of process, participant validation, and social impact -- not just internal validity or transferability. Do not evaluate these studies using post-positivist quality standards.

### The Learner Needs a Secondary Data or Document Analysis Study

When primary data collection is not feasible (no budget, no IRB access, retrospective questions), secondary data analysis and document/content analysis are legitimate alternatives. Distinguish between: quantitative content analysis (coding text for frequency of predefined categories, requires inter-rater reliability, typically Cohen's κ > 0.70 as an acceptable threshold), qualitative document analysis (thematic or discourse analysis of texts), and secondary analysis of existing datasets (e.g., analyzing a national survey's public-use file). Each has different sampling logics and quality standards. Flag that secondary data studies must address the fit between the original data collection purpose and the new research question -- existing data may not have been collected with the current question in mind, creating construct validity concerns.

### The Learner Is Confusing Research Design with Data Collection Method

A common source of confusion: learners say "my methodology is surveys" or "I'm using a qualitative methodology" when they mean "my data collection method is a questionnaire" or "my data will be text-based." The methodology is the overarching framework (case study, grounded theory, cross-sectional survey design, RCT); the method is the tool (interview, questionnaire, observation, document review). Correct this distinction explicitly and early, because it affects how the methodology chapter is structured. A methodology chapter justifies the design choice at the paradigmatic and design level; a methods section describes instruments and procedures.

---

## Example

**Input:**
"I'm a second-year master's student in education. My research question is: 'How do secondary school teachers in urban public schools experience the implementation of restorative justice practices?' I have access to about 10-12 teachers at two schools where I work. I have six months and a modest budget -- basically just my own time and travel. My supervisor says I need to justify my methodology choice. I was thinking of doing a survey, but a friend told me I should do interviews instead. I'm not sure which is right."

---

## Methodology Comparison and Selection

**Learner's Research Question:** How do secondary school teachers in urban public schools experience the implementation of restorative justice practices?
**Research Purpose:** Exploratory and interpretive -- this question seeks to understand subjective meaning-making and lived experience
**Question Type:** Type 4 -- Experiential/Interpretive ("how do people experience X?")
**Discipline/Field:** Education -- master's level research, likely submitted as a thesis or capstone project
**Key Constraints:** 10-12 participants at two sites, 6-month timeline, researcher is an insider at the sites (currently employed there), self-funded

---

### Candidate Methodology Comparison

| Criterion | Qualitative Phenomenology (IPA) | Cross-Sectional Survey | Multiple-Case Case Study |
|-----------|--------------------------------|----------------------|--------------------------|
| **Paradigm** | Interpretivist/constructivist -- reality is subjective and constructed through lived experience | Post-positivist -- attitudes and perceptions can be measured and aggregated | Pragmatist -- understanding a bounded phenomenon in context through multiple evidence types |
| **Fit with this research question** | Excellent -- "experience" is the central construct; IPA is designed to explore how specific individuals make meaning of a phenomenon | Poor -- surveys measure prevalence and frequency of attitudes but cannot capture the texture of lived experience; "how do teachers experience X" cannot be answered with Likert scales | Good -- captures implementation processes and context across two real school sites; less focused on individual experience, more on organizational and contextual patterns |
| **Typical scope/sample for this context** | 6-12 participants is ideal for IPA; homogeneous purposive sample (secondary teachers at urban schools) supports depth | 100+ participants needed for meaningful statistical analysis; 10-12 is far below the threshold for any reliable inferential or even descriptive statistics | 2-3 cases (schools) with multiple embedded units (teachers); 10-12 teachers spread across 2 schools fits a multiple embedded-case design |
| **Data collection approach** | Semi-structured individual interviews (60-90 minutes each); possibly a brief reflective journal or member checking session | Self-administered questionnaire with validated scales (e.g., burnout, attitudes toward RJ); online or paper distribution | Document analysis (school policy, meeting minutes), observations, and semi-structured interviews -- triangulated |
| **Analytic approach** | IPA analytic process: close reading of transcripts, developing experiential themes, clustering into superordinate themes, cross-case analysis across participants | Descriptive statistics (means, frequencies), possibly correlation or regression if scales are compared; requires SPSS or similar | Cross-case pattern analysis; analytic generalization to theory; within-case narrative analysis followed by cross-case synthesis |
| **Key strength for this study** | Directly answers the "how do teachers experience" question; richness of 10-12 in-depth interviews will yield deep, credible findings appropriate for master's-level thesis | None specific to this question -- quantifying experience would distort it; a survey cannot capture what implementation "feels like" to these teachers | Preserves real-world context of two distinct school sites; could capture how school culture shapes experience differently across sites |
| **Key limitation for this study** | Findings are not statistically generalizable; researcher is an insider, which requires careful reflexivity management | Sample of 10-12 is methodologically indefensible for survey research; the question type is incompatible with survey methodology; produces numerically precise but meaninglessly thin data | More complex to execute than a single-methodology qualitative study; requires document access and potentially observation time that may strain the 6-month timeline |
| **Feasibility for this learner** | High -- 10-12 interviews is ideal, timeline of 6 months is sufficient, no special equipment needed beyond a recorder and transcription tool | Low -- sample size is far too small for survey validity; the research question is fundamentally incompatible with this method | Medium -- the two-school structure is a natural fit, but triangulating documents and observations alongside interviews adds complexity in 6 months |

---

### Recommended Methodology: Qualitative -- Interpretive Phenomenological Analysis (IPA)
**Design variant:** Multiple-participant IPA (as opposed to single-case idiographic IPA), using purposive homogeneous sampling

#### Rationale

**1. Question-method fit:**
The research question explicitly asks how teachers "experience" implementation -- a formulation that orients the inquiry toward subjective meaning-making, perception, and sense-making processes. IPA was developed precisely to examine how specific individuals make sense of significant experiences in their lives (Smith, Flowers, and Larkin). A survey instrument could tell you that 7 out of 10 teachers find restorative justice difficult to implement, but it cannot tell you what "difficult" means to them, how that difficulty is embedded in their professional identity, or how it changes over time as implementation unfolds.

**2. Epistemological alignment:**
Restorative justice implementation is a complex social practice that teachers interpret through their professional biographies, school cultures, and relationships with students. The phenomenon does not have a single objective form that can be measured and compared -- it is enacted differently and experienced differently depending on who the teacher is and what context they work in. An interpretivist epistemology, which holds that meaning is constructed through experience and context, is the appropriate foundation. IPA's dual hermeneutic process (the researcher interpreting the participant interpreting their experience) matches this ontological commitment.

**3. Feasibility alignment:**
A sample of 10-12 secondary teachers across two sites is ideal for IPA -- Smith, Flowers, and Larkin recommend 6-8 participants for a master's-level IPA study, making 10-12 a moderately large and credible IPA sample that still permits deep analysis within a 6-month window. Semi-structured interviewing requires no budget beyond a digital recorder (most smartphones suffice) and transcription time or a low-cost transcription service. The researcher's insider status at the two schools facilitates access and rapport, though it requires explicit reflexivity management in the methodology chapter.

**4. Disciplinary legitimacy:**
IPA is well-established in educational research and is a recognized and respected methodology in master's and doctoral education theses in the UK, Australia, Canada, and increasingly in the United States. Creswell and Poth's qualitative research text, Lincoln and Guba's trustworthiness criteria, and Smith, Flowers, and Larkin's IPA-specific methodology guide are all widely cited and will be recognized by education supervisors and examiners. A qualitative inquiry into teacher experience of a social-justice-oriented practice (restorative justice) aligns with the interpretivist and critical traditions that are well-represented in urban education research.

---

### Alternative Considered: Cross-Sectional Survey Design
**Why not selected:** The research question asks "how do teachers experience" -- a question that is epistemologically incompatible with survey methodology. Surveys measure the distribution of attributes or attitudes across a sample; they cannot capture the texture, meaning, or process of lived experience. More critically, a sample of 10-12 participants produces no defensible statistical output -- even descriptive statistics from a sample this small cannot be interpreted without a power analysis showing sufficient precision. The result would be data that is neither statistically meaningful (too few participants) nor experientially meaningful (the wrong instrument). Any supervisor or examiner reviewing this methodology chapter would flag the mismatch between the research question and the method as a fundamental design error. Survey methodology should be considered only if the question were reframed as "What are secondary school teachers' attitudes toward restorative justice?" with a representative sample of 100+ teachers.

---

### Anticipated Methodology Challenges

| Challenge | Pre-emptive Defense |
|-----------|---------------------|
| "Your findings are not generalizable -- how can 10 teachers tell us anything useful about all urban schools?" | IPA does not claim statistical generalizability; it claims analytical transferability. The goal is to generate rich, theoretically grounded insights about the experience of RJ implementation that readers and practitioners in similar contexts can assess for relevance to their own situations -- this is Lincoln and Guba's concept of transferability, which is the appropriate generalizability criterion for interpretive research. |
| "As an insider researcher, your findings are biased by your own experience of RJ implementation" | Insider status is addressed through systematic reflexivity: a reflexivity statement in the methodology chapter documenting my prior assumptions and experiences, bracketing notes written before and after each interview, and member-checking transcripts with participants to confirm accuracy of interpretation. These are standard IPA rigor practices recommended by Smith, Flowers, and Larkin and do not disqualify insider research -- they make it transparent. |
| "With only 6 months and no separate observation protocol, how do you know the data will be sufficient to address the question?" | IPA studies at master's level routinely achieve theoretical depth from 60-90 minute semi-structured interviews alone. With 10-12 interviews producing approximately 10-15 hours of data, there is ample material for the iterative close-reading analysis IPA requires. Sufficiency will be addressed by designing interview questions that elicit rich narrative accounts (critical incident technique, temporal prompts like "walk me through the first time you used a restorative circle") rather than opinion or attitude questions. |

---

### Quality Criteria for Selected Methodology
For IPA and qualitative research broadly, the applicable quality criteria are Lincoln and Guba's trustworthiness framework:
- **Credibility** (analogous to internal validity) -- achieved through prolonged engagement, member-checking, and audit trail
- **Transferability** (analogous to external validity) -- achieved through thick description of context so readers can assess applicability
- **Dependability** (analogous to reliability) -- achieved through a detailed methods audit trail and reflexivity documentation
- **Confirmability** (analogous to objectivity) -- achieved through reflexivity statement and transparent analytic decisions

### Foundational Citations to Establish Methodological Legitimacy
- **Smith, J.A., Flowers, P., and Larkin, M. -- Interpretative Phenomenological Analysis: Theory, Method and Research (2009):** This is the canonical IPA methodology text; citing it establishes that your IPA design follows a recognized, coherent tradition rather than ad hoc qualitative inquiry.
- **Lincoln, Y.S., and Guba, E.G. -- Naturalistic Inquiry (1985):** Establishes the trustworthiness criteria (credibility, transferability, dependability, confirmability) that replace validity and reliability for qualitative research -- essential for defending your quality standards.
- **Creswell, J.W., and Poth, C.N. -- Qualitative Inquiry and Research Design: Choosing Among Five Approaches (4th ed., 2018):** Provides a comparative framework across qualitative traditions (narrative, phenomenology, grounded theory, ethnography, case study) that will help you justify why phenomenology fits better than the alternatives.

---

### Next Steps
1. **Immediate:** Write a 150-200 word reflexivity statement documenting your prior experience with restorative justice at these schools -- this statement should appear early in your methodology chapter and demonstrates epistemological self-awareness
2. **Within one week:** Read Chapters 3 and 4 of Smith, Flowers, and Larkin (2009) to understand IPA's analytic process before designing your interview guide; your interview questions must elicit accounts of experience, not opinions or factual descriptions
3. **Next skill:** Use the `data-collection-plan` skill to design your semi-structured interview protocol -- focus on open, experience-eliciting questions and plan for 60-90 minute interviews with each of your 10-12 participants
