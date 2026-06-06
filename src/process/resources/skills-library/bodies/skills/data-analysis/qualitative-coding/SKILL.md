---
name: qualitative-coding
description: |
  Produces a qualitative coding scheme for interview transcripts or open-text survey responses. Includes initial code list, code definitions, example quotes per code, inter-rater reliability protocol, and thematic synthesis template.
  Use when the user asks to analyze interview data, code open-ended survey responses, build a coding scheme for qualitative research, or synthesize themes from text data.
  Do NOT use for survey design (use survey-design), automated sentiment analysis (use sentiment-analysis-guide), or large-scale text mining (use text-mining-protocol).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "research analysis data-science"
  category: "data-analysis"
  subcategory: "research-analysis"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Qualitative Coding

## When to Use

**Use this skill when:**
- A user presents interview transcripts, focus group recordings, or field notes and wants to make systematic sense of the material -- common in UX research, academic social science, clinical research, and organizational behavior studies
- A user has open-ended survey responses (free-text fields) and wants to identify patterns across respondents rather than reading each response individually
- A user is building a formal codebook for a research project that will involve multiple coders, peer review, or publication, and needs codes with definitions, inclusion/exclusion criteria, and example anchors
- A user is conducting thematic analysis (Braun & Clarke's approach), grounded theory (Charmaz or Strauss & Corbin), framework analysis, or interpretive phenomenological analysis (IPA) and needs structured coding support
- A user wants to reconcile codes from two or more coders, calculate inter-rater reliability, or investigate coding disagreements to improve codebook clarity
- A user has already done first-pass coding and needs help organizing codes into higher-order themes, identifying relationships, and writing a synthesis narrative
- A user is doing longitudinal or comparative qualitative work (e.g., coding the same interview guide administered at two time points, or coding interviews from two different populations) and needs a consistent coding framework that enables comparison

**Do NOT use when:**
- The user wants to design the survey or interview guide that will generate the data (use `survey-design`)
- The user wants sentiment scoring, emotion classification, or tone detection at scale using NLP methods (use `sentiment-analysis-guide`)
- The user wants to apply machine learning, topic modeling (LDA, BERTopic), or corpus-level text analysis to thousands of documents (use `text-mining-protocol`)
- The user wants to synthesize findings from multiple published empirical studies -- meta-analysis or systematic review (use `research-synthesis`)
- The user is doing purely quantitative content analysis with pre-specified categories and frequency counts only, with no interpretive element
- The user wants automated code application using a trained classifier once a codebook already exists (use `text-mining-protocol` for the automation layer)

---

## Process

### Step 1: Establish the Research Context and Data Landscape

Before producing a single code, you must understand the epistemic goal of the analysis. Ask or infer:

- **Methodology:** Is the user doing thematic analysis, grounded theory, framework analysis, IPA, or discourse analysis? Each has different conventions for coding. Thematic analysis codes meaning; grounded theory codes actions and processes; IPA codes lived experience; framework analysis maps data against a predefined matrix.
- **Data type and volume:** Interview transcripts (typically 3,000-8,000 words each), focus group transcripts (6,000-15,000 words each), open-ended survey responses (30-300 words each), field notes, or documents. Volume determines strategy -- 8 interviews demands deep interpretive coding; 800 survey responses demands efficiency-oriented coding with saturation sampling.
- **Research questions:** The RQs directly constrain what codes are relevant. A code that does not address a research question is clutter. If the user has not stated RQs, ask for them or help construct them before proceeding.
- **Epistemological stance:** Is the analysis realist (treating data as reflecting an external reality), constructivist (treating data as co-produced by interviewer and participant), or critical (looking for power structures and ideological formations)? This shapes whether codes describe observable behaviors, subjective meanings, or structural conditions.
- **Prior coding:** Has any coding been done? Are there existing frameworks (e.g., a behavior change wheel, a technology acceptance model, a prior study's codebook) that should inform a deductive starting point?
- **Intended output:** A published paper, a UX research report, an internal stakeholder deck, or a policy brief? The granularity and formality of the codebook should match the audience.

### Step 2: Select the Coding Approach and Analytic Framework

The choice of approach must be explicit -- it determines everything downstream.

- **Inductive (bottom-up) coding:** No predefined codes. First-pass codes are descriptive and data-near. Labels are often direct words or phrases from the data (in vivo codes). Best for grounded theory and exploratory studies where theory is underdeveloped. Requires more iterations of code refinement. Use when research questions are genuinely open: "What is this?" not "How much of this is there?"
- **Deductive (top-down) coding:** Codes come from a theory, model, prior literature, or a framework (e.g., COM-B model for behavior change, UTAUT for technology adoption). Code definitions are set before reading the data. Best for confirmatory analysis, replication, or evaluation of an intervention. Risk: data that doesn't fit the framework may be suppressed.
- **Hybrid (most common in applied research):** Begin with a deductive framework of 5-15 anchor codes based on theory or RQs. Apply these to the first 2-3 data sources. Allow inductive codes to emerge for content that does not fit the anchor codes. After 25-30% of the data, review and reconcile deductive and inductive codes.
- **Structural vs. thematic codes:** Structural codes tag sections by topic (e.g., "Background," "Onboarding experience," "Feature use") -- useful for navigation in large datasets. Thematic codes tag meaning and pattern (e.g., "Felt abandoned by vendor," "Workaround behavior"). Good codebooks use structural codes at Level 1 and thematic codes at Level 2-3.
- **Process codes (gerunds):** In grounded theory, codes are written as actions: "Weighing options," "Seeking validation," "Abandoning the tool." Gerund codes reveal process and temporality, which is essential for building theory about how things happen, not just what things are.

### Step 3: Develop the Initial Codebook

A codebook is a formal document, not a list. Each code entry must contain all of the following:

- **Code ID:** A short uppercase alphanumeric label used in the annotated text (e.g., `VALUE-GAP`, `SUPPORT-01`, `PROC-WORKAROUND`). Hierarchical codes use dot notation: `SUPP.SLOW`, `SUPP.QUALITY`.
- **Code name:** A plain-language label (3-6 words). For thematic codes, the name should carry interpretive meaning -- "Friction with Automated Processes" not "Automation Problems."
- **Definition:** 2-4 sentences describing what conceptual territory this code covers, grounded in the analytic framework. The definition should be intelligible to someone who has not read the data.
- **Inclusion criteria:** Specific, behavioral conditions that qualify a segment for this code. List 2-4 criteria. These should resolve 80% of borderline cases without discussion.
- **Exclusion criteria:** What superficially similar content does NOT get this code. Exclusions are what prevent code conflation -- the most common source of low inter-rater reliability.
- **Typical segment length:** A guidance cue -- "usually a sentence to short paragraph," "typically a turn in dialogue," "can apply to a single phrase." This prevents over-coding (entire paragraphs) and under-coding (isolated words).
- **Example anchors:** At minimum 2 example quotes per code -- a prototypical example (central case) and a borderline example (edge of the definition). Both should be from the actual data or, if coding has not started, from pilot data or constructed illustrative examples clearly labeled as such.
- **Related codes:** Which codes are conceptually adjacent, and how to distinguish this code from them. "This code vs. FRUSTRATION: FRUSTRATION captures emotional response; VALUE-GAP captures rational cost-benefit reasoning. A segment can receive both."
- **Flags:** Whether this code should trigger a memo (theoretical or analytical note), whether it is a "key" code for the main RQ, or whether it is a structural/navigation code.

For the initial codebook size:
- Inductive first-pass: 15-40 working codes are normal. These will collapse by 30-50% during refinement.
- Deductive starting framework: 8-20 codes.
- Final codebook for a typical 10-20 interview study: 15-35 codes across 3-7 themes.
- Never exceed 40 final codes for a dataset of fewer than 30 sources. More codes means each code appears too rarely to support thematic claims.

### Step 4: Conduct Structured First-Pass Coding

The first pass is about coverage and calibration -- do not aim for perfection.

- **Read before coding:** Read each transcript in full before applying codes. This prevents out-of-context coding. For long transcripts (5,000+ words), write a one-paragraph summary before coding.
- **Unit of analysis:** Segment at the level of meaning, not grammar. A "meaning unit" is the smallest piece of text that can stand alone and carry an interpretable meaning. In practice, this is usually a sentence to a short paragraph. Never code a single word. Never apply a code to an entire page.
- **Multiple codes per segment:** Most segments can receive 2-3 codes legitimately. A segment about paying for a product nobody uses touches VALUE-GAP, UNDERUTILIZATION, and potentially CHAMPION-LEFT. Allow this -- it is meaningful.
- **The 3-second rule for borderline segments:** If you cannot decide whether to apply a code within 3 seconds, write a memo about the segment and move on. Do not force codes. The memo becomes evidence for either splitting the code or creating a new one.
- **In vivo codes:** When a participant uses a phrase that perfectly captures a concept (e.g., "digital shadow," "paper ceiling," "phantom features"), preserve it as an in vivo code and define it. These become the strongest evidence for participant-grounded interpretation.
- **Memo writing during first pass:** Write analytical memos -- brief notes connecting what you are seeing in the data to your emerging interpretation. Memos are the raw material of the Discussion section. Record: "SUPPORT.SLOW seems to cluster with CONTRACT-RENEWAL timing -- participants who churned at renewal mention slow support more than those who churned mid-contract."
- **First-pass checkpoint at 20-30%:** Stop after coding 20-30% of the dataset. Review: Are any codes applied to more than 40% of segments? (Too broad -- split it.) Are any codes applied fewer than 3 times? (Too narrow -- merge or delete.) Do any two codes co-occur on more than 70% of the same segments? (Likely redundant -- consider merging.)

### Step 5: Codebook Refinement and Version Control

Codebooks are living documents. Uncontrolled changes destroy inter-rater reliability.

- **Version every change:** Use version numbering (Codebook v1.0, v1.1, v2.0). A minor version (v1.0 to v1.1) is a clarification of an existing definition or addition of a new example anchor. A major version (v1.x to v2.0) is the addition, deletion, or fundamental redefinition of a code.
- **Code splitting:** When a code is applied to very different types of content, split it. "TECHNICAL-PROBLEM" splits into "TECHNICAL.SETUP" (difficulty during installation/configuration) and "TECHNICAL.RUNTIME" (errors during ongoing use). Splitting requires re-coding all previously coded segments with the original code.
- **Code merging:** When two codes almost always appear together and the distinction does not matter for the research questions, merge them. Document what was merged and why.
- **Code retirement:** If a code was applied fewer than 3 times across the entire dataset, retire it unless it represents an analytically significant finding (e.g., a rare but severe experience). A code applied once is a note in the memo, not a theme.
- **Code hierarchy review:** Ensure Level 1 codes (broad categories) are genuinely superordinate to Level 2 codes (specific subcategories). "Support Experience" (Level 1) > "SUPPORT.SLOW," "SUPPORT.QUALITY," "SUPPORT.ACCESSIBILITY" (Level 2). Flat codebooks with 35 peer-level codes are difficult to synthesize into themes.

### Step 6: Establish Inter-Rater Reliability

Inter-rater reliability (IRR) is not optional in any research that will be peer-reviewed or used to make significant decisions. It operationalizes the claim that your codes are interpretable by others.

- **Sample selection for double-coding:** Select a stratified random sample of 10-15% of the data for double-coding. Ensure the sample includes different interview types, interview lengths, and participant profiles. Do not select the "easiest" transcripts.
- **Blind double-coding:** The second coder should apply the codebook without seeing the first coder's annotations. Provide the codebook document, but not the coded transcript.
- **Unit of agreement:** Agree in advance what counts as agreement -- code presence/absence per segment, or the exact segment boundaries coded? Presence/absence per pre-defined segment is far more tractable and is the standard for applied research.
- **Cohen's kappa (κ) calculation:** κ = (P_o -- P_e) / (1 -- P_e), where P_o is observed agreement and P_e is expected chance agreement. Thresholds: κ < 0.40 = poor agreement (codebook needs major revision); κ 0.41-0.60 = moderate (codebook needs clarification); κ 0.61-0.80 = substantial (acceptable for most purposes); κ > 0.80 = near-perfect (publication-grade). Calculate kappa per code, not just overall -- a code with κ < 0.60 needs its definition revised even if overall κ is 0.75.
- **Percent agreement as a supplement:** Report both kappa and raw percent agreement. Kappa corrects for chance but can be misleadingly low when one code is very rare (the prevalence-bias paradox). If a code appears in only 5% of segments, even 95% agreement produces a kappa of near zero because chance agreement is already very high.
- **Krippendorff's alpha:** For more than two coders, or for ordinal/interval coding (e.g., coding sentiment intensity on a 1-5 scale), use Krippendorff's alpha instead of kappa. Threshold is also 0.80 for publication, 0.67 as acceptable minimum.
- **Disagreement resolution:** After double-coding, compare annotations in a dedicated review session. For each disagreement: (a) identify whether it was a definition issue (the code definition was ambiguous) or an application issue (one coder made an error). Definition issues require a codebook revision. Application issues require re-training the second coder. After resolution, calculate post-discussion kappa to confirm improvement.
- **Single-coder research:** When only one coder is available, conduct intra-rater reliability. Code a 10% sample, set it aside for a minimum of 2 weeks with no review, then recode the same sample from scratch without looking at the first pass. Calculate kappa between first and second pass. Target κ > 0.75.

### Step 7: Thematic Synthesis

Moving from codes to themes is an interpretive act, not a sorting exercise. Themes are not just clusters of codes -- they are claims about meaning.

- **Candidate theme generation:** Group codes that address the same conceptual territory. Use a physical or digital card-sorting method: write each code name on a card, spread them out, and group them without pre-judging the groupings. Repeat independently if possible, then compare groupings.
- **Theme naming:** A good theme name makes a conceptual claim that goes beyond the data's surface. "Unmet Expectations of Automation" is better than "Automation Issues" because it specifies the nature of the problem. Use noun phrases (not questions, not gerunds) for theme names in thematic analysis.
- **Frequency and prevalence:** For each theme, count (a) the number of data sources in which it appears at least once, (b) the total number of coded segments belonging to this theme, and (c) for each supporting code, its frequency. A theme present in fewer than 25% of data sources should be framed as a minority finding, not a central theme.
- **Thick description:** For each theme, write 2-4 sentences of analytic interpretation -- what this theme means for the research question, what it suggests about participants' experiences, and how it relates to existing literature or theory. This is the bridge from data to Discussion.
- **Negative cases:** Actively search for data that contradicts each theme. A theme with no negative cases is a sign the analysis is confirming rather than interrogating the data. Even one well-documented negative case strengthens analytical credibility.
- **Theme relationships:** Identify whether themes are (a) sequential (Theme A precedes Theme B in the experience), (b) conditional (Theme B appears only when Theme C is also present), or (c) in tension (Theme A and Theme D pull in opposite directions and participants navigate the conflict). These relationships are the core of the Discussion narrative.
- **Saturation assessment:** Saturation occurs when new data sources produce no new codes and no new themes. In a typical 10-20 interview study with a relatively homogeneous population, saturation is usually reached at 8-12 interviews. Heterogeneous populations require more data. Document the point of saturation.

### Step 8: Produce the Coding Report

Compile all elements into a formal report. The report must be self-contained -- a reader should be able to understand the analysis without access to the raw data.

- Include the full codebook as an appendix (not just a summary table)
- Include coding frequency tables with both raw counts and percentages
- Include representative quotes for every theme (minimum 2, maximum 5 per theme)
- Include a theme relationship diagram or narrative if relationships are a central finding
- Include IRR results and resolution process
- Include a methodological transparency section acknowledging limitations, reflexivity statements, and scope of claims

---

## Output Format

```
## Qualitative Coding Report: [Study/Project Name]

### Research Context

| Field | Detail |
|-------|--------|
| Data type | [Interview transcripts / Open-ended survey responses / Focus group transcripts / Field notes] |
| Data volume | [N sources, approximate total word count] |
| Methodology | [Thematic analysis / Grounded theory / Framework analysis / IPA / Content analysis] |
| Coding approach | [Inductive / Deductive / Hybrid -- specify anchor framework if deductive/hybrid] |
| Epistemological stance | [Realist / Constructivist / Critical] |
| Codebook version | [v1.0 at start; current version] |

**Research Questions:**
1. [RQ 1 -- the primary question driving code selection]
2. [RQ 2]
3. [RQ 3, if applicable]

---

### Codebook (Version [X.X])

#### Level 1: [Theme/Domain Name]

##### Code: [CODE-ID]
- **Code Name:** [Plain-language label, 3-6 words]
- **Definition:** [2-4 sentences explaining the conceptual territory of this code]
- **Inclusion Criteria:**
  - [Specific condition 1]
  - [Specific condition 2]
  - [Specific condition 3]
- **Exclusion Criteria:**
  - [What looks similar but is not this code]
  - [Second exclusion criterion]
- **Typical Segment Length:** [Phrase / Sentence / Short paragraph / Extended passage]
- **Prototypical Example:** "[Representative quote from data]"
- **Borderline Example:** "[Marginal quote that still qualifies, with note on why]"
- **Distinguish From:** [CODE-ID-2 -- one sentence on how to tell them apart]
- **Triggers Memo:** [Yes / No -- Yes if this code has theoretical significance beyond the RQs]

[Repeat for each code]

---

### Coding Summary Table

| Code ID | Code Name | Frequency (N mentions) | Prevalence (% of sources) | Theme |
|---------|-----------|----------------------|--------------------------|-------|
| [CODE-01] | [Name] | [N] | [%] (n of N sources) | [Theme name] |
| [CODE-02] | [Name] | [N] | [%] | [Theme name] |
| [CODE-03] | [Name] | [N] | [%] | [Theme name] |

**Total coded segments:** [N]
**Total codes applied:** [N] (includes multiple codes per segment)
**Code saturation reached:** [Yes/No -- after source N of M]

---

### Themes

#### Theme [N]: [Descriptive Theme Name]
- **Definition:** [2-4 sentences -- what this theme represents and what it claims about participant experience or the phenomenon under study]
- **Analytic significance:** [1-2 sentences on what this theme contributes to answering the research questions]
- **Supporting codes:** [CODE-01, CODE-03, CODE-07]
- **Prevalence:** [N of M sources contain this theme (X%)]
- **Total coded segments:** [N segments across supporting codes]

**Key Quotes:**
> "[Quote 1 -- prototypical illustration of the theme]" -- [Source ID, e.g., P04, line 234]

> "[Quote 2 -- a different facet of the theme]" -- [Source ID]

> "[Quote 3 -- if available, a quote that shows complexity or nuance]" -- [Source ID]

**Negative Cases:**
- [Source ID] contradicts this theme because: [explanation]. This is accounted for by: [how the analysis addresses this contradiction]

**Thick Description:**
[3-5 sentences of interpretive narrative connecting this theme to the research questions, to each other, and to relevant theoretical or practical frameworks]

---
[Repeat for each theme -- typically 3-7 themes]

---

### Theme Relationship Map

| Relationship | Type | Description |
|-------------|------|-------------|
| [Theme 1] → [Theme 2] | Sequential | [Theme 1 appears earlier in participants' accounts and leads to Theme 2] |
| [Theme 3] ↔ [Theme 4] | Co-occurrence | [These themes appear together in X of Y sources; when both appear, the effect is...] |
| [Theme 5] ↕ [Theme 6] | Tension | [Participants holding Theme 5 often express conflicting pull toward Theme 6] |

---

### Inter-Rater Reliability

| Element | Detail |
|---------|--------|
| Coders | [Coder 1 ID / role, Coder 2 ID / role] |
| Sample double-coded | [N sources, X% of total dataset] |
| Sample selection method | [Random / Stratified random / Purposive] |
| Reliability metric | [Cohen's kappa / Krippendorff's alpha / Percent agreement] |
| Overall result | [κ = X.XX or α = X.XX, interpreted as: poor/moderate/substantial/near-perfect] |

**Per-Code Reliability:**

| Code ID | κ / α | Interpretation | Action Taken |
|---------|-------|---------------|-------------|
| [CODE-01] | [0.XX] | [Substantial] | [None needed / Definition clarified] |
| [CODE-02] | [0.XX] | [Moderate -- below threshold] | [Exclusion criteria added; re-coded] |

**Disagreement Resolution:** [Description of the discussion process, how many segments were disputed, and how they were resolved -- by consensus, by majority, or by third-coder arbitration]

---

### Methodological Transparency

- **Codebook evolution:** [Codes added inductively: list them. Codes split: explain splits. Codes merged: explain merges. Codes retired: list them and why.]
- **Saturation:** [Was saturation reached? At which source? What was the evidence?]
- **Reflexivity:** [Any relevant researcher positionality that may have shaped code development or interpretation]
- **Scope of claims:** [What population or context do these themes apply to? What generalizations are not supported by this data?]
- **Limitations:** [Self-report bias, sample characteristics, single-coder limitations, language considerations, etc.]
```

---

## Rules

1. **Never produce codes without definitions.** A list of code names is not a codebook. Every code delivered to the user must include its definition, inclusion criteria, exclusion criteria, and at least one example anchor. Undefined codes are the single largest cause of low inter-rater reliability.

2. **Inclusion criteria must be specific enough to resolve 80% of borderline cases without a conversation.** Test this: write three hypothetical segments and decide whether each qualifies. If you cannot decide for two of the three without external input, the inclusion criteria are too vague.

3. **Exclusion criteria must name at least one specific code that this code could be confused with.** "Not general complaints" is not an exclusion criterion. "Do not apply when the segment refers to product pricing without referencing perceived value -- apply PRICE-ABSOLUTE instead" is an exclusion criterion.

4. **Codes must cover the data, not summarize the research question.** A research question like "Why do customers churn?" is not a code. Codes are granular observations from the data -- "Triggered by renewal price increase," "Switched to a competitor after free trial," "Lost internal product champion." The research question is answered by synthesizing codes into themes.

5. **Do not exceed 40 final codes for datasets under 30 sources.** With 15 interviews and 40 codes, each code averages fewer than 6 appearances -- too sparse to support a thematic claim. Force consolidation: if two codes cannot be distinguished by a second coder reading only the codebook (not the data), merge them.

6. **Cohen's kappa below 0.60 on any individual code means that code's definition must be revised before full coding proceeds.** A low-kappa code will contaminate the frequency counts for its entire theme. Do not average across codes to report an "acceptable" overall kappa while leaving a problematic individual code in place.

7. **Frequency counts are required for all codes and all themes.** "This theme emerged prominently" is not a finding. "This theme appeared in 11 of 15 sources (73%) and was the most frequently coded theme with 34 total segments" is a finding. Frequency does not replace interpretation -- it grounds it.

8. **Every theme must have a negative case documented or explicitly state that none were found and explain why.** A theme with zero negative cases in a dataset of 15 interviews almost certainly reflects confirmation bias in code application. Document the search process for negative cases even if they are absent.

9. **Memos must be written during coding, not reconstructed after.** Analytical memos -- observations about patterns, tentative interpretations, connections between codes -- are the primary evidence for the interpretive claims in the Discussion. If memos were not written during coding, the audit trail is broken. Instruct the user to write memos as a parallel process to coding, not as a retrospective step.

10. **Thematic synthesis must produce claims, not category labels.** "Support Experience" is a category. "Inadequate support during critical moments amplifies existing dissatisfaction and accelerates the decision to churn" is a thematic claim. Every theme in the final report should be expressible as a sentence that makes a claim, not just a noun phrase that names a topic.

11. **Do not apply codes to segments that are outside the scope of the research questions without flagging them separately.** Off-topic rich content (e.g., a participant describing an unrelated product complaint while being interviewed about onboarding) should be flagged in a memo, not coded with an existing code stretched to fit. Stretching codes to capture off-topic content corrupts the codebook's conceptual integrity.

12. **Codebook version control is mandatory when more than one coder is involved.** If Coder A changes a definition after Coder B has already applied the old definition to 30% of the data, the dataset is now internally inconsistent. All codebook changes must be logged with a version number, change date, rationale, and specification of which previously coded segments need re-review.

---

## Edge Cases

### Single coder, no second coder available
Conduct intra-rater reliability as a substitute. After completing first-pass coding of the full dataset, select a 10% stratified random sample. Set aside the original annotations for a minimum of 2 weeks -- do not review them during this interval. Recode the same sample from scratch using only the codebook document. Calculate Cohen's kappa between the two passes. A κ above 0.75 is acceptable evidence of consistent application. Below 0.75, identify the specific codes responsible and revise their definitions. Intra-rater reliability does not substitute for the external validity check that second-coder IRR provides -- acknowledge this limitation explicitly in the methodological transparency section.

### Very large open-ended dataset (300+ survey responses)
Development phase: draw a stratified random sample of 60-80 responses (stratified by demographic variable or survey condition if applicable) for codebook development. Ensure the sample captures the full range of response length and content. Apply the full codebook development process (Steps 1-6) to this sample. Once the codebook is stable (no new codes emerging across the last 10 responses coded), apply it to the full dataset. For the full dataset application: use a structured coding matrix (rows = responses, columns = code IDs, cell = 1/0 or count) to enable quantitative summaries. Reserve deep interpretive coding -- selecting key quotes, writing thick descriptions -- for the 20-30 responses most relevant to the RQs. Report: (a) quantitative frequency table for all responses, (b) qualitative theme synthesis from the development sample plus selected full-dataset examples.

### Data collected in a language the analyst does not speak natively
Never translate first and code the translation -- this introduces a second layer of interpretation that is uncontrolled and unacknowledged. Instead: (a) work with a bilingual coder who codes in the original language, (b) develop the codebook bilingually (definitions in both languages), (c) select key quotes for the report and translate them with back-translation verification (translate to English, have a second bilingual person translate back to original language, compare for fidelity). In the methodological notes, state clearly: coding was conducted in [language], quotes were translated by [method], and cultural context was [how it was or was not addressed]. Cultural-conceptual equivalence -- whether a code developed in one cultural context transfers meaningfully to another -- must be explicitly discussed.

### Longitudinal data (same participants coded at two or more time points)
Use the same codebook at all time points to enable comparison. This means the codebook must be finalized before Time 2 coding begins, even if Time 2 data reveals new inductive codes. New codes at Time 2 should be applied retroactively to Time 1 data only if the concept was present but uncoded, not if it genuinely did not exist at Time 1. Report results as a comparison matrix: for each theme, show prevalence at Time 1 and Time 2 (N sources at T1 vs. T2), and characterize the direction of change. Look specifically for codes present at Time 1 but absent at Time 2 (concept disappearance) and codes absent at Time 1 but present at Time 2 (concept emergence) -- these temporal shifts are often the most important findings in longitudinal qualitative work.

### Contradictory or incoherent data sources
Some interviews or responses are internally inconsistent -- a participant states they were satisfied with support and then describes a 2-week wait for a resolution. Do not average or ignore the contradiction. Apply both the positive code (SUPPORT.POSITIVE) and the negative code (SUPPORT.SLOW) to the relevant segments. Write a memo about the contradictory source. At the theme synthesis stage, use contradictory sources as primary evidence for complexity and nuance. Contradictions within a source often signal: (a) temporal change (satisfied at first, dissatisfied later), (b) social desirability bias (presenting favorably, then revealing negatives), or (c) genuinely mixed experience. The interpretation of why the contradiction exists is as valuable as the codes themselves.

### User wants to use the codebook as a training set for automated classification
The codebook must meet a higher bar for formal rigor than a qualitative-only study. Specifically: (a) every code must have a minimum of 15-20 coded example segments before training -- codes with fewer examples will produce unreliable classifiers, (b) the coded examples must be balanced across sources and participant types to prevent domain-specific overfitting, (c) inter-rater reliability must be documented per code with κ > 0.75 for any code that will be automated, and (d) the codebook must be treated as frozen after the training set is finalized -- post-hoc changes require full retraining. Flag this use case to the user early, because the annotation requirements for an ML training dataset are significantly more demanding than for a qualitative report.

### Researcher positionality creates potential bias in code development
In qualitative research -- particularly in critical, participatory, or clinical contexts -- the analyst's identity, professional role, or personal experience with the topic can shape which codes emerge and how they are defined. This is not automatically a problem, but it must be acknowledged and managed. Strategies: (a) write a reflexivity statement before coding begins, identifying your assumptions and how they might influence code development; (b) use member checking -- sharing themes with participants for feedback on whether they recognize their experiences in the themes; (c) conduct peer debriefing -- have someone unfamiliar with the data review the codebook and ask "What are you assuming here?" The reflexivity statement belongs in the final report's methodological transparency section, not as an afterthought.

### Thin data -- very short responses (fewer than 50 words per source)
Short responses (e.g., single-question survey text fields, social media posts, app reviews) do not support complex multi-code segment analysis. Adapt the approach: (a) apply a maximum of 2 codes per response rather than 2-3 per segment, (b) use response-level rather than segment-level coding (the unit of analysis is the whole response), (c) supplement with quantitative analysis (frequency, cross-tabulation with demographic variables) because the thinness of the data limits interpretive claims, (d) be cautious about themes that appear in fewer than 30% of sources -- with very short responses, low prevalence may reflect question scope rather than genuine rarity of the experience.

---

## Example

**Input:** "I have 12 transcripts from semi-structured interviews with frontline nurses about electronic health record (EHR) adoption at their hospital. The hospital rolled out a new EHR system 6 months ago. I need to understand their experiences, particularly what is working, what barriers they face, and what would improve adoption. The interviews average about 45 minutes each. I'll be presenting findings to hospital leadership."

---

## Qualitative Coding Report: Frontline Nurse EHR Adoption -- 6-Month Post-Implementation Study

### Research Context

| Field | Detail |
|-------|--------|
| Data type | Semi-structured interview transcripts |
| Data volume | 12 transcripts, approximately 65,000 words total (~5,400 words/interview) |
| Methodology | Thematic analysis (Braun & Clarke, reflexive variant) with hybrid coding approach |
| Coding approach | Hybrid -- deductive anchor codes from Technology Acceptance Model (TAM: Perceived Usefulness, Perceived Ease of Use) and Normalization Process Theory (NPT: coherence, cognitive participation, collective action, reflexive monitoring); inductive codes allowed for content outside these frameworks |
| Epistemological stance | Constructivist -- treating participant accounts as meaningful interpretations of their experience, not objective reports of facts |
| Codebook version | v2.1 (v1.0 at start; v2.0 after first-pass checkpoint at 30%; v2.1 after IRR review) |

**Research Questions:**
1. What aspects of the new EHR system do frontline nurses perceive as improving or hindering their clinical workflow?
2. What individual, team, and organizational factors influence EHR adoption at 6 months post-implementation?
3. What specific changes to the system, training, or support would increase adoption and reduce burden?

---

### Codebook (Version 2.1)

#### Level 1: Workflow Integration

##### Code: WFLOW.ENHANCE
- **Code Name:** EHR Perceived Workflow Enhancement
- **Definition:** Participant describes a specific way in which the EHR system has improved, accelerated, or simplified a clinical or administrative task compared to the prior system or paper-based process. The enhancement must be explicitly linked to the EHR functionality, not attributed to general workflow changes.
- **Inclusion Criteria:**
  - Explicit comparison ("before, we used to... now with the EHR...")
  - Statement that a specific task is faster, easier, or more reliable due to the EHR
  - Description of a clinical or administrative benefit (medication reconciliation accuracy, faster order entry, remote chart access)
- **Exclusion Criteria:**
  - Do not apply when participant expresses a wish that the EHR could improve a task -- apply WFLOW.UNMET instead
  - Do not apply when the benefit is attributed to a training improvement, not the system itself
- **Typical Segment Length:** Sentence to short paragraph
- **Prototypical Example:** "Medication reconciliation used to take me 20 minutes per patient because I was cross-referencing three different paper lists. Now I pull it up in the EHR and it is all there. That genuinely saves me time on every admission."
- **Borderline Example:** "It is easier to document now, I think." (Qualifies -- vague but contains an explicit positive evaluation of documentation. Note: prompt for specifics in a follow-up if possible.)
- **Distinguish From:** WFLOW.WORKAROUND -- participants sometimes describe workarounds as improvements; distinguish by whether the EHR feature is being used as designed (WFLOW.ENHANCE) or is being bypassed (WFLOW.WORKAROUND)
- **Triggers Memo:** No

##### Code: WFLOW.BURDEN
- **Code Name:** EHR-Induced Documentation Burden
- **Definition:** Participant describes the EHR system as adding time, cognitive effort, or procedural complexity to a task that was previously simpler or faster. This code specifically addresses workflow inefficiency caused by the EHR's design or data entry requirements, not technical failures.
- **Inclusion Criteria:**
  - Explicit statement that a task takes longer or requires more steps than before
  - Description of excessive click paths, redundant data entry, or mandatory fields that do not apply to the patient
  - Statement that documentation time is cutting into direct patient care time
- **Exclusion Criteria:**
  - Do not apply to technical errors or system downtime -- apply TECH.FAILURE instead
  - Do not apply to training deficits that are causing inefficiency -- apply TRAIN.GAP instead
  - Do not conflate with general stress or fatigue not specifically attributed to the EHR
- **Typical Segment Length:** Sentence to two paragraphs
- **Prototypical Example:** "I am clicking through nine screens to document a routine vital signs check. On paper it was one line. I am spending 40% of my shift on the computer and 60% with patients. It used to be the reverse."
- **Borderline Example:** "There are a lot of fields to fill in." (Borderline -- apply if the participant goes on to describe time cost or patient care impact; do not apply if this is a passing comment)
- **Distinguish From:** WFLOW.WORKAROUND -- burden often triggers workarounds; code both if a segment describes burden AND a workaround strategy
- **Triggers Memo:** Yes -- note specific screens or tasks mentioned; these are potential targets for workflow redesign recommendations

##### Code: WFLOW.WORKAROUND
- **Code Name:** Workaround Behavior
- **Definition:** Participant describes an unofficial, unofficial, or improvised practice they use to accomplish a task in a way that bypasses or supplements the EHR's intended workflow. Workarounds are adaptive responses to perceived usability failures.
- **Inclusion Criteria:**
  - Explicit description of a practice that is not standard protocol (e.g., printing charts and re-entering data later, keeping parallel paper notes, using a personal spreadsheet)
  - Description of a practice the participant knows is unofficial or that they would not share with management
  - Any statement like "what I actually do is..." that diverges from the official process
- **Exclusion Criteria:**
  - Do not apply to legitimate customizations within the EHR (custom views, templates) -- these are adaptations, not workarounds
  - Do not apply when the participant is describing what a colleague does, not their own practice -- code in a separate structural tag if tracking social observation data
- **Typical Segment Length:** Short paragraph to extended passage
- **Prototypical Example:** "Officially I am supposed to enter medications directly in the EHR at the bedside. What I actually do is write them on a sticky note during rounds and enter them all at the nurse station at the end of the shift. Otherwise I fall behind."
- **Borderline Example:** "I use my own shorthand in the free text fields." (Borderline -- apply if this shorthand is a deliberate workaround to avoid structured fields; do not apply if it is a cosmetic preference)
- **Distinguish From:** WFLOW.BURDEN -- burden is the reason; WFLOW.WORKAROUND is the response. Code both when both are present.
- **Triggers Memo:** Yes -- workaround descriptions are patient safety signals. Note the specific workaround and the associated risk.

#### Level 1: Training and Support

##### Code: TRAIN.INITIAL
- **Code Name:** Initial Training Adequacy
- **Definition:** Participant evaluates the quality, duration, format, or relevance of the training received before or during the EHR go-live. This includes both positive and negative evaluations of initial training.
- **Inclusion Criteria:**
  - Direct reference to go-live training, pre-launch classes, or onboarding education
  - Evaluation of whether initial training prepared them for real clinical use
  - Description of what was covered or not covered in initial training
- **Exclusion Criteria:**
  - Do not apply to ongoing or post-go-live support -- apply TRAIN.ONGOING instead
  - Do not apply to peer-to-peer learning on the job -- apply TRAIN.PEER instead
- **Typical Segment Length:** Sentence to short paragraph
- **Prototypical Example:** "We had two 4-hour sessions before go-live. They showed us the system in a classroom with fake patients. When I got to the floor with real patients and real time pressure, I had no idea how to do a rapid admission. The training did not simulate that."
- **Borderline Example:** "The training was okay, I guess." (Apply -- minimal but present evaluation; note as low-information)
- **Distinguish From:** TRAIN.GAP -- TRAIN.INITIAL evaluates what was provided; TRAIN.GAP identifies specific skill or knowledge deficits that resulted
- **Triggers Memo:** No

##### Code: TRAIN.GAP
- **Code Name:** Specific Training Knowledge Gap
- **Definition:** Participant identifies a specific skill, workflow, or EHR function they do not know how to perform or perform confidently, attributed to training deficiency rather than system design. The gap must be specific and actionable.
- **Inclusion Criteria:**
  - "I do not know how to..." or "Nobody showed me how to..."
  - Description of avoiding or delegating a specific EHR function because of uncertainty
  - Description of having to look up how to do something every time (indicating non-retention)
- **Exclusion Criteria:**
  - Do not apply when the system genuinely cannot perform the task -- apply FEAT.MISSING instead
  - Do not apply to general frustration without a specific skill reference
- **Typical Segment Length:** Sentence to short paragraph
- **Prototypical Example:** "I still do not know how to run a medication history report. I ask the charge nurse every time. I think I was shown once but it was not part of the main training module."
- **Borderline Example:** "There are things in there I have never touched." (Apply only if the participant specifies what those things are in the surrounding context)
- **Distinguish From:** FEAT.MISSING -- gap is about not knowing how to use an existing feature; FEAT.MISSING is about a feature that does not exist
- **Triggers Memo:** No

##### Code: TRAIN.PEER
- **Code Name:** Peer-to-Peer Learning and Support
- **Definition:** Participant describes learning EHR skills from a colleague rather than from formal training, or describes providing informal support to colleagues. Includes both positive and negative framings of peer learning.
- **Inclusion Criteria:**
  - Reference to asking a colleague, a "super user," or an informal EHR expert for help
  - Description of teaching or demonstrating the EHR to a peer
  - Reliance on informal social networks for EHR knowledge
- **Exclusion Criteria:**
  - Do not apply to formal super user programs or designated EHR trainers -- apply TRAIN.INITIAL or TRAIN.ONGOING
  - Do not apply when colleague assistance is about a clinical question unrelated to the EHR
- **Typical Segment Length:** Sentence to short paragraph
- **Prototypical Example:** "My go-to is the nurse in Bay 4. She figured out all the shortcuts. I ask her before I ever go to the help desk. She knows more than the official trainers."
- **Triggers Memo:** Yes -- peer learning networks are informal infrastructure; patterns here suggest where formal support is failing
- **Distinguish From:** SUPPORT.FORMAL -- TRAIN.PEER is informal, unsanctioned knowledge transfer

#### Level 1: Organizational and Contextual Factors

##### Code: ORG.LEADERSHIP
- **Code Name:** Leadership Stance on EHR Adoption
- **Definition:** Participant describes or evaluates the visible attitude, messaging, or behavior of unit managers, charge nurses, or hospital leadership toward EHR adoption. Includes both supportive and unsupportive leadership stances.
- **Inclusion Criteria:**
  - Direct reference to a manager, charge nurse, director, or hospital administrator
  - Description of leadership communication about EHR expectations or support
  - Perception that leadership is or is not aware of frontline EHR challenges
- **Exclusion Criteria:**
  - Do not apply when participant references an IT department or training team -- apply SUPPORT.FORMAL
  - Do not apply to general organizational culture comments not specifically linked to EHR
- **Typical Segment Length:** Sentence to paragraph
- **Prototypical Example:** "My nurse manager has never actually used the EHR for a full shift. When I told her about the documentation time, she said 'everyone will adjust.' She does not understand what adjust means when you are short-staffed."
- **Triggers Memo:** Yes -- leadership alignment is a primary predictor of sustained adoption
- **Distinguish From:** SUPPORT.FORMAL -- leadership stance is about visible attitude and culture; SUPPORT.FORMAL is about whether help resources exist

##### Code: ORG.STAFFING
- **Code Name:** Staffing Context Affecting EHR Use
- **Definition:** Participant links EHR documentation burden directly to staffing levels, patient ratios, or workload intensity. This is an inductive code -- emerged from data, not from initial TAM/NPT framework.
- **Inclusion Criteria:**
  - Explicit connection between patient load and EHR documentation time pressure
  - Description of EHR tasks being skipped, delayed, or abbreviated specifically because of staffing
  - Statement that EHR demands are incompatible with the current staffing level
- **Exclusion Criteria:**
  - Do not apply to general staffing complaints without a specific EHR link
- **Typical Segment Length:** Sentence to short paragraph
- **Prototypical Example:** "On a 1:8 shift, I physically cannot do the EHR the way they want me to. Something has to give. Usually it is the documentation."
- **Triggers Memo:** Yes -- staffing context is an organizational constraint that limits what technology interventions can achieve; important for leadership recommendations
- **Distinguish From:** WFLOW.BURDEN -- burden is a system design issue; ORG.STAFFING is a resource allocation issue that amplifies the burden

#### Level 1: System Features and Technical Issues

##### Code: FEAT.MISSING
- **Code Name:** Missing or Inadequate Feature
- **Definition:** Participant identifies a specific system feature or capability that does not exist in the current EHR and that they need to perform their work effectively. The missing feature must be specific and operational, not a wish-list item.
- **Inclusion Criteria:**
  - Explicit statement that the system cannot perform a task the participant needs
  - Description of a workflow gap that requires paper or a separate system to fill
  - Reference to a feature that existed in the prior system but is absent in the new one
- **Exclusion Criteria:**
  - Do not apply when the feature exists but the participant does not know how to use it -- apply TRAIN.GAP instead
  - Do not apply to cosmetic preferences (font size, color scheme)
- **Typical Segment Length:** Sentence to paragraph
- **Prototypical Example:** "We cannot attach a photograph to a wound care note. We are a wound care unit. I am describing a wound in words when I could show a picture that is worth a thousand words. That is a missing feature."
- **Triggers Memo:** No
- **Distinguish From:** TRAIN.GAP -- if uncertain, ask: "Does the feature exist in the system at all?" If no, FEAT.MISSING. If yes but participant does not know how to use it, TRAIN.GAP.

##### Code: TECH.FAILURE
- **Code Name:** Technical Failure or System Unreliability
- **Definition:** Participant describes instances of the EHR system failing to function as expected -- errors, crashes, slowdowns, login failures, data loss, or downtime -- that disrupted their clinical work.
- **Inclusion Criteria:**
  - Description of a system error, crash, freeze, or timeout
  - Reference to downtime or planned or unplanned system unavailability
  - Loss of entered data due to a system failure
  - Login or authentication failures
- **Exclusion Criteria:**
  - Do not apply to slow performance when it is clearly attributable to the hospital's network rather than the EHR -- note in a memo if the distinction matters for recommendations
  - Do not apply to user errors that result in lost data (e.g., accidentally navigating away from a page)
- **Typical Segment Length:** Sentence to paragraph
- **Prototypical Example:** "Three times in the last month the system has crashed during a rapid admission and I have lost everything I had entered. I now write parallel paper notes as
