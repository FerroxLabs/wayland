---
name: research-question
description: |
  Helps learners refine broad topics into focused, researchable questions using the PICO or FINER framework. Produces a well-formed research question with scope boundaries and feasibility assessment.
  Use when a learner asks to develop a research question, narrow a broad topic, focus a research idea, or determine if a question is researchable.
  Do NOT use for choosing a research methodology (use `research-methodology`), for finding sources (use `literature-search`), or for writing a thesis statement (use writing category skills).
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
# Research Question

## When to Use

**Use this skill when a learner:**
- Presents a broad topic and wants help narrowing it to something researchable (e.g., "I want to research climate change" or "I'm studying poverty and education")
- Has a draft research question that feels too vague, too broad, or unanswerable within a realistic scope and needs diagnostic feedback
- Is stuck between two or three possible questions and wants a framework to evaluate which is strongest
- Needs to assess feasibility before committing to a research direction -- especially if they have a fixed timeline (semester, dissertation proposal deadline) or limited access to data or participants
- Is working in a specific discipline (health sciences, social sciences, humanities, education) and needs a question formulated in the conventions of that field
- Explicitly mentions PICO, FINER, SPIDER, or another research question framework and wants guidance applying it
- Has a thesis or dissertation proposal due and needs to articulate a researchable, defensible question

**Do NOT use this skill when:**
- The user already has a solid research question and wants to choose a methodology to answer it -- use `research-methodology` instead
- The user wants to search databases or identify sources for their question -- use `literature-search` instead
- The user wants to write a thesis statement or argument for a paper (a thesis statement is a claim; a research question is an open inquiry) -- use writing category skills
- The user is designing survey instruments, interview protocols, or data collection tools -- that is methodology design, not question development
- The user needs help with statistical hypotheses (null and alternative hypotheses) for an already-designed study -- that is a statistics or methods skill
- The user is an instructor designing an assignment prompt about research questions -- use teaching subcategory skills

---

## Process

### Step 1: Diagnose the Starting Point

Before applying any framework, assess exactly where the user is in their thinking.

- Ask or infer: Do they have a broad topic, a partially formed question, or a fully drafted question that needs evaluation?
- Identify the discipline -- the conventions for a well-formed research question differ significantly between a clinical health sciences paper (PICO is standard), a social science study (PICO-T or SPIDER may fit better), and a humanities research essay (open-ended interpretive questions are appropriate)
- Ask about their research context: undergraduate paper (4-8 weeks), master's thesis (6-12 months), doctoral dissertation (2-4 years), or a funded research project -- feasibility thresholds differ drastically across these
- Identify any non-negotiables: Are they constrained to a specific population, dataset, or geographic location? Do they have IRB (Institutional Review Board) access or are they limited to secondary data?
- Determine their current familiarity with the literature -- a student who has done preliminary reading has a different starting point than one who is choosing a topic from scratch

### Step 2: Apply the Narrowing Funnel

Most learners start too broad. Use a structured three-stage funnel before applying any formal framework.

- **Stage 1 -- Broad topic:** Identify the general domain (e.g., "nutrition and academic performance")
- **Stage 2 -- Focused topic:** Add at least two constraining variables -- a specific population, a timeframe, a mechanism, or a context (e.g., "breakfast consumption and morning concentration in primary school children")
- **Stage 3 -- Researchable question:** Convert the focused topic into an interrogative form with a specific, measurable outcome and a clear comparison or direction (e.g., "Does eating breakfast before school improve reading comprehension scores in children aged 6-10 compared to those who skip breakfast?")
- A question is too broad if it could be answered by an entire textbook -- the "textbook test" is a useful heuristic: if a whole book already exists answering your question, narrow it
- A question is too narrow if it is already answered in the existing literature without a meaningful gap, or if the population is so specific that recruiting participants or finding data would be impossible

### Step 3: Select the Appropriate Framework

Match the framework to the discipline and research design rather than defaulting to PICO for everything.

**PICO** -- best for clinical health sciences, evidence-based practice, intervention studies, and systematic reviews
- P (Population/Patient): Who is being studied, defined with specific characteristics
- I (Intervention/Exposure): The treatment, program, or exposure being evaluated
- C (Comparison): The control condition, alternative treatment, or baseline
- O (Outcome): The measurable result, defined with a specific instrument or metric where possible

**PICO-T** -- extends PICO by adding T (Timeframe): how long until the outcome is measured; essential for longitudinal studies

**SPIDER** -- better suited for qualitative and mixed-methods research in social and health sciences
- S (Sample): Who are the participants?
- PI (Phenomenon of Interest): What experience, behavior, or process is being explored?
- D (Design): What research method is used (interview, ethnography, survey)?
- E (Evaluation): What is being measured or assessed?
- R (Research type): Qualitative, quantitative, or mixed?

**FINER Criteria** -- not a question-building framework but a quality-evaluation checklist; apply it AFTER building the question using PICO or SPIDER to verify it is worth pursuing:
- F (Feasible): Can this be done given realistic time, budget, sample size, and expertise?
- I (Interesting): Is there genuine intellectual or practical curiosity driving this?
- N (Novel): Does this question add something -- a new population, a new context, a new comparison, or a new outcome measure?
- E (Ethical): Can this be studied without unacceptable risk to participants?
- R (Relevant): Does this connect to existing theory, policy, or practice gaps?

**For humanities and interpretive social sciences**, neither PICO nor SPIDER is appropriate. Use open-ended "how" or "why" framing that specifies: the phenomenon, the context, the theoretical lens (if applicable), and the scope boundary (time period, geographic region, text corpus, or community).

### Step 4: Build the Question Component by Component

Work through each component of the chosen framework explicitly, not as an abstract exercise but with the user's actual content.

- For each component, generate a draft version and then interrogate it: Is the population defined specifically enough? ("Adults" is not specific enough; "adults aged 40-65 with Type 2 diabetes diagnosed within the last 5 years" is.)
- Push for measurable outcomes whenever the research design is quantitative: "improved well-being" must become "scores on the WHO-5 Well-Being Index" or "self-reported life satisfaction on a 10-point Likert scale"
- For qualitative questions, push for clarity on the phenomenon and the population but resist over-specifying the outcome -- qualitative questions are intentionally exploratory
- Make the comparison explicit even when it feels obvious -- "compared to a control group receiving standard care" prevents ambiguity in design and interpretation
- Write out the assembled question as a single grammatically complete interrogative sentence, then check that all components are visible in the sentence

### Step 5: Run the FINER Quality Check

After assembling the question, evaluate it against all five FINER criteria systematically.

- **Feasibility audit:** Estimate the minimum sample size conceptually -- can the user realistically access this many participants or this dataset? A question requiring 500 clinical patients with a rare diagnosis is not feasible for an undergraduate. Suggest adjustments: shift to a more accessible population, use secondary data (existing datasets like NHANES, IPUMS, or GSS), or reduce the comparison to a before/after design
- **Interest test:** Ask: who is the audience for this answer? If only the researcher would care, the question needs to connect to a wider debate, practical problem, or policy question
- **Novelty scan (conceptual):** Even without a full literature review, prompt the user to think about what the answer would add -- is this a new population, a new context, a new outcome measure, or a new theoretical angle? Coach them to articulate the "so what"
- **Ethics flag:** Check for vulnerable populations (minors, prisoners, people with cognitive impairments), sensitive topics (trauma, illegal behavior, mental health), or risks of harm. Flag questions that will require full IRB review vs. those likely to qualify for expedited review or exemption. Note when secondary data eliminates the ethics concern
- **Relevance check:** Ask: does this connect to a documented gap in the literature, a real-world problem, a policy debate, or a theoretical controversy? If the user cannot name the connection, the question may need reframing

### Step 6: Write the Scope Statement

A good research question alone is not enough for a proposal or literature review plan -- it must be accompanied by explicit scope boundaries.

- Specify what IS included: population characteristics, geographic scope, time period covered, intervention or phenomenon definition
- Specify what is explicitly EXCLUDED and why: adjacent populations, related interventions, extended timeframes -- this prevents scope creep and preempts examiner or peer reviewer objections
- State the unit of analysis: individuals, households, organizations, texts, events, or communities
- Identify the research design implied by the question (experimental, quasi-experimental, cross-sectional survey, case study, content analysis) -- this links question development to methodology planning without crossing into full methodology design

### Step 7: Deliver the Final Question Package and Assess Next Steps

Assemble everything into the output format and provide actionable direction.

- Present the final refined question prominently -- it should be the centerpiece of the output
- Show the PICO/SPIDER components table explicitly so the user can see how their content maps to the framework
- Show the FINER assessment as a table with a pass/flag/fail for each criterion and specific improvement actions for any flagged criteria
- Identify the one most important next step: typically a preliminary literature search (use `literature-search` skill) to verify novelty and sharpen the question
- If the FINER check reveals significant feasibility or ethics problems, prioritize redesigning the question before moving to methodology

---

## Output Format

```
## Research Question Development: [Broad Topic]

**Discipline:** [Field -- e.g., public health, educational psychology, sociology]
**Research Context:** [Undergraduate paper / Master's thesis / Doctoral dissertation / Independent research]
**Framework Applied:** [PICO / PICO-T / SPIDER / Interpretive framing]
**Timeline:** [Available research period]

---

### Narrowing Funnel

| Stage | Statement |
|-------|-----------|
| Broad topic | [The original topic as stated] |
| Focused topic | [Topic narrowed to specific population + variable + context] |
| Research question (draft) | [First interrogative formulation] |
| Research question (refined) | [Final version after FINER evaluation] |

---

### Framework Decomposition

#### [PICO / SPIDER] Components

| Component | Label | Your Content | Notes / Refinements |
|-----------|-------|-------------|---------------------|
| P | Population | [Specific population with defining characteristics] | [Any needed narrowing] |
| I | Intervention / Phenomenon | [Specific intervention, exposure, or phenomenon] | [Operationalization notes] |
| C | Comparison / Design | [Control condition, alternative, or research design] | [Clarification] |
| O | Outcome / Evaluation | [Specific measurable outcome with instrument if known] | [Measurement notes] |

---

### Final Research Question

> **[Complete, single-sentence research question in interrogative form]**

---

### FINER Quality Assessment

| Criterion | Status | Evidence | Action Required |
|-----------|--------|----------|-----------------|
| Feasible | ✅ / ⚠️ / ❌ | [Specific reasoning] | [What to change if flagged] |
| Interesting | ✅ / ⚠️ / ❌ | [Specific reasoning] | [What to change if flagged] |
| Novel | ✅ / ⚠️ / ❌ | [Specific reasoning] | [What to change if flagged] |
| Ethical | ✅ / ⚠️ / ❌ | [Specific reasoning] | [What to change if flagged] |
| Relevant | ✅ / ⚠️ / ❌ | [Specific reasoning] | [What to change if flagged] |

**Overall FINER verdict:** [Proceed / Revise and re-check / Requires significant redesign]

---

### Scope Boundaries

**Included:**
- Population: [Specific defining characteristics]
- Setting/Context: [Geographic, institutional, or temporal scope]
- Timeframe: [Data collection period or historical period under study]
- Outcome measure: [Specific instrument, scale, or indicator]

**Explicitly Excluded:**
- [Excluded population or subgroup -- and why]
- [Excluded variable or intervention -- and why]
- [Excluded time period -- and why]

**Unit of Analysis:** [Individual / Household / Organization / Text / Event]

**Implied Research Design:** [Experimental RCT / Quasi-experimental / Cross-sectional survey / Longitudinal cohort / Case study / Systematic review / Content analysis / Ethnographic / etc.]

---

### Question Type Classification

| Dimension | Classification |
|-----------|---------------|
| Question type | [Descriptive / Comparative / Correlational / Causal / Exploratory] |
| Research paradigm | [Positivist / Interpretivist / Critical / Pragmatist] |
| Data type implied | [Quantitative / Qualitative / Mixed] |
| Level of evidence targeted | [RCT / Observational / Survey / Case study / etc.] |

---

### Recommended Next Steps

1. **Immediate (this week):** [Specific action -- usually a preliminary literature search to verify novelty]
2. **Short-term (1-2 weeks):** [e.g., identify existing validated instruments for the outcome measure]
3. **Before finalizing:** [e.g., consult advisor or IRB about ethical classification]

**Connect to these skills next:**
- `literature-search` -- to verify the question is novel and identify the key debates your research enters
- `research-methodology` -- once the question is locked, to choose the design that can answer it
```

---

## Rules

1. **Never skip the Narrowing Funnel** -- users who arrive with a broad topic must pass through all three funnel stages before a framework is applied. Jumping directly to PICO with a broad topic produces a broad PICO, which is not useful.

2. **Never default to PICO for all questions** -- PICO is designed for intervention research in health sciences. Applying it to a qualitative inquiry, a humanities question, or an exploratory social science study will produce a distorted or irrelevant formulation. Always match the framework to the discipline and design.

3. **The outcome component must be operationalized when the question is quantitative** -- "improved outcomes" or "better well-being" are not acceptable outcomes in a PICO question. Push until the user names a specific instrument, scale, behavioral indicator, or clinical measure (e.g., "PHQ-9 depression score," "GPA at end of semester," "systolic blood pressure in mmHg").

4. **The final research question must be a single interrogative sentence** -- a research question is not a statement, not a list of questions, and not a paragraph. If the user's topic seems to require multiple questions, help them identify the primary question and designate the others as sub-questions or limitations.

5. **FINER is evaluative, not generative** -- FINER criteria do not tell you what the question should be; they tell you whether the question you have built is worth pursuing. Always build the question with PICO or SPIDER first, then evaluate with FINER.

6. **Flag IRB-relevant ethical issues explicitly** -- if the question involves minors, prisoners, people with mental illness or cognitive impairment, deception, sensitive personal data, or potential for participant harm, state this directly and recommend the learner consult their institution's IRB before proceeding. Do not simply give the ethics criterion a passing grade because the topic sounds benign.

7. **Feasibility must be assessed against the user's actual constraints** -- a question that is feasible for a funded research team is not feasible for an undergraduate. Always anchor feasibility to the stated context: available time, sample access, budget, and researcher expertise. If any constraint makes the question infeasible, suggest a concrete redesign (e.g., shift to secondary data, reduce the scope, simplify the design).

8. **Scope boundaries must be stated as explicit inclusions AND exclusions** -- listing only what is included is insufficient. Explicit exclusions demonstrate intellectual clarity, prevent scope creep, and address the most common examiner objections in advance.

9. **Do not cross into methodology design** -- this skill ends at the research question and its implied design classification. It does not select sampling strategies, choose statistical tests, or specify data collection instruments in detail. If the user wants to go there, direct them to `research-methodology`.

10. **A question that fails two or more FINER criteria requires redesign before proceeding** -- if Feasibility and Ethics both fail, or if Novelty and Relevance both fail, do not simply list the problems and move on. Actively redesign the question in the output, show the revised version, and re-run the FINER check on the revised question.

11. **Discipline conventions matter for question phrasing** -- in education and social sciences, "explore," "examine," and "investigate" signal qualitative work; "determine," "compare," and "assess the effect of" signal quantitative work. Help the user choose verbs that match their intended design and the conventions of their field.

12. **One final research question, multiple sub-questions if needed** -- complex projects may have 2-4 sub-questions supporting the primary question. Sub-questions must each be more specific than the primary question and together must cover the scope needed to answer it. They must not be so numerous that they constitute separate studies.

---

## Edge Cases

### The User Has a Dissertation or Thesis Proposal Deadline

When a learner is working toward a formal proposal, the stakes and depth of the output increase significantly. The question must survive scrutiny from an academic committee, not just pass FINER.

- Require the question to connect explicitly to an identified theoretical framework or conceptual model (e.g., social cognitive theory, transactional model of stress, institutional theory)
- The novelty check must go beyond "I haven't seen this before" -- prompt the user to articulate the specific gap: a population gap (studied elsewhere but not in this context), a methodological gap (previous studies used weaker designs), a temporal gap (older studies predate a significant contextual change), or a theoretical gap (an existing theory has not been tested in this domain)
- The scope statement must be committee-ready: precise enough that a reader can immediately see what the study will and will not do
- Recommend the user identify 3-5 anchor studies that their question is directly in conversation with before finalizing

### The User's Topic Involves a Vulnerable Population

Vulnerable populations (children under 18, incarcerated individuals, people with cognitive impairments, pregnant women in clinical research, refugees or undocumented individuals) trigger mandatory ethical considerations.

- Flag the FINER Ethics criterion with ⚠️ even if the study design seems low-risk -- the elevated scrutiny applies regardless
- Note that IRB review will likely require additional safeguards: parental consent for minors, capacity assessments, community liaison involvement for marginalized populations
- Suggest that the user consider whether a secondary data approach (using an existing dataset that already went through IRB) could answer a closely related question with less ethical complexity
- Do not discourage research with vulnerable populations -- much of the most important social and health research involves them -- but ensure the user understands the procedural requirements

### The User Is in a Humanities Discipline

PICO and SPIDER do not apply to literary analysis, historical research, philosophical inquiry, or interpretive cultural studies.

- Reframe the question-building process around: phenomenon + context + theoretical/interpretive lens + scope boundary
- A humanities research question should be genuinely open-ended (not answerable with "yes" or "no") and should invite interpretation, argument, and engagement with primary sources
- Examples of well-formed humanities questions: "How does Toni Morrison's use of fragmented narrative structure in Beloved challenge conventional linear representations of traumatic memory?" or "In what ways did Cold War geopolitical anxieties shape urban planning policy in West German cities between 1949 and 1961?"
- The FINER criteria still apply but must be interpreted differently: "Feasible" means the primary sources or texts are accessible; "Novel" means the specific interpretive angle has not been exhausted in the existing scholarship
- Scope boundaries in humanities are typically defined by text corpus, time period, geographic region, or theoretical tradition rather than by population and sample size

### The User Has Too Many Questions and Cannot Choose

Learners sometimes arrive with a list of 5-10 possible questions, reflecting excitement but lacking focus. Paralysis by options is common.

- Apply a three-step triage: (1) eliminate questions that fail FINER on Feasibility or Ethics immediately, (2) cluster remaining questions by theme and identify which share a population or phenomenon, (3) identify which single question is most central to the learner's stated interest
- A useful disambiguation tool: ask "If you could only publish one finding from this research, what would you most want the world to know?" -- the answer almost always points to the primary question
- The remaining questions often become sub-questions or future research directions, not dead ends -- reframe them that way to reduce the sense of loss in narrowing

### The User's Draft Question Is Already Well-Formed

Occasionally a learner arrives with a question that is already good -- specific, measurable, feasible, and novel. Resist the urge to add unnecessary complexity.

- Run the FINER check and confirm all five criteria pass
- If the question passes FINER cleanly, say so directly and explain why -- validation is useful feedback
- Focus the remaining output on scope refinement (explicit exclusions), operationalization of the outcome measure if not yet specified, and clear next steps toward methodology
- Do not artificially complicate a good question to justify the exercise

### The User Is Working With Existing Datasets (Secondary Data Analysis)

When a learner plans to use an existing dataset (NHANES, General Social Survey, IPUMS, UK Biobank, administrative records, etc.), the question-building process must be constrained by what variables actually exist in the data.

- The population is constrained by the dataset's sampling frame -- a question about undocumented immigrants cannot be answered with a dataset that only captured legal residents
- The outcome and exposure variables must correspond to variables actually collected in the dataset -- the user should check the codebook or data dictionary before finalizing the question
- The FINER Feasibility criterion automatically improves with secondary data (no recruitment needed) but Novelty may be lower (many people have analyzed the same dataset)
- Encourage the user to frame novelty around a specific subgroup analysis, a new combination of variables, or a more recent data wave not yet analyzed in the literature

### The User's Question Has Already Been Answered in the Literature

If preliminary discussion reveals that the question the user wants to ask has a clear, settled answer in the literature, this is not a failure -- it is valuable information that requires a pivot.

- Distinguish between a question that is fully settled ("Does smoking cause lung cancer?" -- settled, not a research question) and one that is partially contested or needs replication in a new context ("Does smoking cessation counseling delivered via smartphone app reduce smoking rates in low-income adults?" -- active research area)
- Offer four pivot strategies: (1) change the population to one not studied, (2) change the context or setting, (3) examine a moderating variable (does the effect differ by gender, age, or socioeconomic status?), or (4) use a stronger research design to replicate and confirm or challenge an existing finding
- Reframe this as "entering the conversation" rather than "starting from scratch" -- all good research is in dialogue with existing work

---

## Example

**Input:** "I'm a second-year master's student in public health. I want to research something about smartphone apps and mental health. I have about 8 months. I'm thinking about questions like -- do apps help? Are they useful? What's the best app? I'm not sure how to narrow this down."

**Output:**

---

## Research Question Development: Smartphone Apps and Mental Health

**Discipline:** Public Health (with behavioral health focus)
**Research Context:** Master's thesis (8-month timeline)
**Framework Applied:** PICO-T (intervention study framing; timeframe matters given the 8-month window)
**Timeline:** 8 months available

---

### Narrowing Funnel

| Stage | Statement |
|-------|-----------|
| Broad topic | "Smartphone apps and mental health" |
| Focused topic | "Smartphone-based CBT apps and depression symptom reduction in young adults with mild-to-moderate depression" |
| Research question (draft) | "Do CBT-based smartphone apps reduce depression symptoms in young adults?" |
| Research question (refined) | "Among adults aged 18-35 with mild-to-moderate depression (PHQ-9 score 5-19), does 8 weeks of daily use of a structured CBT-based smartphone app reduce PHQ-9 scores by a clinically meaningful margin (≥5 points) compared to a waitlist control group?" |

---

### Framework Decomposition

#### PICO-T Components

| Component | Label | Your Content | Notes / Refinements |
|-----------|-------|-------------|---------------------|
| P | Population | Adults aged 18-35 with mild-to-moderate depression (PHQ-9 score 5-19) | "Young adults" is too vague; age 18-35 is a common and accessible cohort; PHQ-9 cutoffs give clinical specificity |
| I | Intervention | 8 weeks of daily structured CBT-based smartphone app use (≥15 minutes/day) | Specifying CBT-based excludes unstructured mood-tracking apps; the dose (≥15 min/day) matters for intervention fidelity |
| C | Comparison | Waitlist control group (no app intervention during the study period) | Waitlist control is more ethically acceptable than no-treatment control for a depression study; it also avoids withholding potentially helpful treatment indefinitely |
| O | Outcome | PHQ-9 score change from baseline; clinically meaningful improvement defined as ≥5-point reduction | PHQ-9 is a validated, widely-used 9-item instrument; a ≥5-point change is the established MCID (Minimal Clinically Important Difference) in the literature |
| T | Timeframe | 8-week intervention period; outcomes measured at baseline, week 4, and week 8 | 8 weeks is standard in CBT app efficacy trials; two interim measurement points allow dropout and trajectory analysis |

---

### Final Research Question

> **Among adults aged 18-35 with mild-to-moderate depression (PHQ-9 score 5-19), does 8 weeks of daily structured CBT-based smartphone app use (≥15 minutes/day) reduce PHQ-9 scores by at least 5 points compared to a waitlist control group?**

---

### FINER Quality Assessment

| Criterion | Status | Evidence | Action Required |
|-----------|--------|----------|-----------------|
| Feasible | ⚠️ | Running a true RCT with a clinical population in 8 months is extremely tight -- recruitment, IRB approval, 8-week data collection, and analysis must all fit in the window | Consider shifting to a secondary data analysis using an existing app trial dataset, OR conduct a single-arm pre-post pilot study without a control group and reframe the question accordingly |
| Interesting | ✅ | Digital mental health is a high-priority research area; app effectiveness is actively debated given a 2019 meta-analysis (Linardon et al.) showing highly variable effect sizes | Strong interest; connects to telehealth expansion and mental health access gaps |
| Novel | ✅ | The specific combination of PHQ-9 as primary outcome, CBT-specific app design, and the 18-35 age cohort with defined severity thresholds adds specificity that much existing literature lacks | Verify novelty by searching PubMed and PsycINFO for systematic reviews in this area before finalizing |
| Ethical | ⚠️ | Recruiting individuals with active depression requires careful informed consent, crisis referral protocols, and mental health support provisions; IRB will require full review, not expedited | Plan for 6-10 weeks of IRB processing time; ensure crisis response protocol is built into study design; consult your IRB office immediately |
| Relevant | ✅ | Directly relevant to public health practice: if apps are effective, they can dramatically reduce cost and access barriers for mental health care in underserved populations | Connect to WHO digital health strategy and US Surgeon General's 2021 mental health crisis advisory for policy relevance framing |

**Overall FINER verdict:** ⚠️ Revise and re-check -- the question is intellectually sound but two operational concerns (feasibility timeline and IRB process) require immediate attention before proceeding. Two redesign paths are offered below.

---

### Redesign Options

**Path A -- Retain the RCT design (more rigorous, higher risk for timeline):**
Reduce the intervention period to 6 weeks (still evidence-supported for CBT app trials), begin IRB submission in month 1, and aim for a streamlined recruitment approach through a university counseling center partnership (which often has IRB infrastructure already in place). Revise the question to reflect 6 weeks.

**Path B -- Shift to secondary data or systematic review (lower risk, still publishable):**
Reframe as a systematic review and meta-analysis of existing CBT app RCTs with PHQ-9 as the primary outcome. This eliminates IRB concerns and recruitment timeline problems, and a well-conducted meta-analysis in this area would itself be a novel and publishable contribution. The research question becomes: "What is the pooled effect size of CBT-based smartphone app interventions on PHQ-9 scores in adults with mild-to-moderate depression compared to control conditions, based on RCTs published between 2015 and 2024?"

---

### Scope Boundaries (for Path A -- Primary Study)

**Included:**
- Population: Adults aged 18-35, English-speaking, with PHQ-9 baseline score of 5-19 (mild-to-moderate range)
- Setting: University or community recruitment in a single metropolitan area
- Timeframe: 8-week intervention window, with follow-up measurement at week 4 and week 8
- Outcome measure: PHQ-9 (Patient Health Questionnaire-9); validated, free, 5-minute administration
- App type: Structured CBT-based apps with lesson/module delivery (e.g., apps built on CBT principles with psychoeducation and behavioral activation components)

**Explicitly Excluded:**
- Individuals with PHQ-9 scores ≥20 (severe depression) -- excluded because this population requires clinical treatment, not a self-guided app, and poses higher ethical risk in a waitlist design
- Apps that are primarily mood-tracking or journaling tools without a structured CBT curriculum -- excluded to maintain intervention consistency and avoid a heterogeneous treatment condition
- Participants currently receiving psychotherapy or taking psychotropic medications -- excluded to isolate the app's effect; this should be a study eligibility criterion
- Generalized anxiety, PTSD, or other co-occurring conditions as primary outcomes -- excluded to maintain outcome focus; these may be measured as secondary outcomes if time allows

**Unit of Analysis:** Individual adult participant

**Implied Research Design:** Randomized controlled trial (RCT) with two parallel arms (intervention vs. waitlist control); if redesigned per Path B, systematic review with meta-analysis

---

### Question Type Classification

| Dimension | Classification |
|-----------|---------------|
| Question type | Causal -- assessing whether the intervention produces the outcome |
| Research paradigm | Positivist -- hypothesis-testing, quantitative, generalizable findings |
| Data type implied | Quantitative (PHQ-9 scores; pre-post with control) |
| Level of evidence targeted | Level II -- RCT (or Level I if redesigned as meta-analysis) |

---

### From Broad Topic to This Question -- What Changed and Why

| Original phrase | Problem | Resolution |
|----------------|---------|-----------|
| "Smartphone apps" | Includes mood trackers, crisis lines, meditation apps, CBT tools -- far too heterogeneous to study as a single intervention | Narrowed to "CBT-based smartphone apps" -- a theoretically coherent category with existing efficacy literature |
| "Mental health" | Encompasses depression, anxiety, PTSD, psychosis, eating disorders, and more | Narrowed to "mild-to-moderate depression" with a validated threshold (PHQ-9 5-19) |
| "Young adults" | No agreed definition; could mean 16-40 depending on the source | Specified as 18-35 -- a cohort with high smartphone adoption, high depression prevalence, and realistic recruitment accessibility |
| "Do apps help?" | A yes/no question with no specification of help for whom, by how much, compared to what, or over what period | Replaced with a fully specified question including population, intervention, comparison, outcome, and timeframe |
| "What's the best app?" | A consumer recommendation question, not a research question -- unanswerable in a single study | Reframed as a comparative effectiveness question across CBT-based app designs -- a valid research direction but a different study entirely |

---

### Recommended Next Steps

1. **Immediate (this week):** Search PubMed and PsycINFO using the terms "CBT smartphone app" AND "depression" AND "randomized controlled trial" -- identify the 3-5 most recent systematic reviews to confirm your question is novel and to extract effect size benchmarks for your power calculation
2. **Within 2 weeks:** Contact your institution's IRB office to discuss the study design and get an estimate of review timeline -- this is the single biggest schedule risk for Path A; early contact can save 4-6 weeks
3. **Before finalizing the question:** Operationalize your app selection criteria -- decide whether you will study a specific named app, a category of apps meeting defined criteria, or allow participants to choose from a vetted list; this decision changes your intervention definition and affects internal validity
4. **Advisor consultation:** Share this question package with your thesis advisor before proceeding to methodology -- advisors often have existing IRB protocols, participant pools, or dataset access that could dramatically shift the feasibility picture

**Connect to these skills next:**
- `literature-search` -- run the PubMed/PsycINFO search to verify novelty, identify the key systematic reviews, and begin mapping the gap your research fills
- `research-methodology` -- once the question is locked (and IRB path is confirmed), use this to select and justify your research design, sampling strategy, and analysis plan
