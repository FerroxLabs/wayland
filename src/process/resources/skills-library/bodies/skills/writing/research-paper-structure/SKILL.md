---
name: research-paper-structure
description: |
  Structures research papers in IMRaD format (Introduction, Methods, Results, and Discussion) or social sciences format with section-by-section guidance, producing a complete paper framework.
  Use when the user asks to structure a research paper, write an academic paper, organize a study for publication, or create an IMRaD paper.
  Do NOT use for literature reviews (use literature-review), abstracts only (use abstract-writing), or editing an existing paper (use academic-paper-review).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "academic-writing writing research"
  category: "writing"
  subcategory: "academic-writing"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---
# Research Paper Structure

## When to Use

**Use this skill when:**
- A user asks to structure, draft, or organize an original research paper for journal submission, conference proceedings, or academic publication
- A user has collected empirical data (experimental, observational, survey-based, computational) and needs to know how to organize it into a publishable paper
- A user is writing an original research paper and asks which sections to include, in what order, and what each section must accomplish
- A user is converting a thesis chapter, conference presentation, or technical report into a journal-format paper
- A user explicitly mentions IMRaD, APA format for empirical papers, journal submission, or study write-up
- A user is a graduate student writing their first peer-reviewed empirical paper and needs section-by-section scaffolding
- A user is writing a methods paper, a replication study, or a multi-study paper with more than one experiment or dataset

**Do NOT use this skill when:**
- The user wants only a literature review with no original data or argument -- use `literature-review`
- The user wants only an abstract for a completed paper -- use `abstract-writing`
- The user needs feedback or revision on an already-written paper -- use `academic-paper-review`
- The user is writing a thesis or dissertation (different structural requirements around chapter length, committee expectations, and institutional formatting) -- use `thesis-writing`
- The user is writing a purely theoretical or philosophical argument with no empirical component -- use `argumentative-essay` or `theoretical-framework`
- The user is writing a systematic review or meta-analysis (PRISMA checklist applies, specialized structure) -- use `systematic-review`
- The user is writing a case study report for a business or clinical audience, not a research journal -- use `case-study-report`
- The user needs only a title or abstract critique -- use `abstract-writing` or `academic-paper-review`

---

## Process

### Step 1: Gather Paper Parameters Before Touching the Structure

Before proposing any structure, collect the following information. Ask explicitly if the user has not provided it.

- **Discipline:** Natural sciences (biology, chemistry, physics), social sciences (psychology, sociology, education), engineering and computer science, health sciences (medicine, nursing, public health), or humanities (history, literary studies, philosophy). This determines which structure applies.
- **Study design:** Experimental (randomized, quasi-experimental), observational (cross-sectional, longitudinal, cohort, case-control), qualitative (interview, ethnographic, grounded theory), mixed methods, computational/simulation, or theoretical.
- **Data type:** Quantitative (numeric outcomes, statistical analysis), qualitative (coded themes, narrative), or mixed. This determines how to structure the Results/Findings section.
- **Target venue:** A specific journal (e.g., Journal of Experimental Psychology, PLOS ONE, Nature Communications), a conference (IEEE, ACM, NeurIPS), or a course submission. Journals have author guidelines that override defaults -- check word limits, section requirements, and figure/table caps.
- **Key contribution:** Ask the user to state in one sentence what this paper adds that did not exist before. If they cannot state it, help them identify it. A paper with an unclear contribution will fail peer review regardless of structure.
- **Citation style:** APA 7th, APA 6th, IEEE, Chicago 17th (author-date or notes), Vancouver, MLA, or journal-specific. This affects reference formatting throughout.
- **Word or page limit:** Many journals specify total word counts (e.g., 8,000 words for a full article, 3,000 for a brief report), which forces proportional allocation across sections.

### Step 2: Select and Explain the Correct Structure

Match the structure to the discipline and study type. Never apply IMRaD by default to all papers.

**IMRaD (Introduction, Methods, Results, and Discussion):**
- The dominant structure in natural sciences, experimental psychology, health sciences, and quantitative social sciences
- Suited for: randomized experiments, observational studies, survey studies with statistical analysis, computational studies
- Each section has a strict functional role -- deviation confuses reviewers and editors

**Extended IMRaD (Introduction, Literature Review, Methods, Results, Discussion, Conclusion):**
- Common in social sciences journals, education research, and health services research
- The Literature Review is a standalone section (not folded into the Introduction) and is typically 1,000-2,000 words
- A separate Conclusion section (300-500 words) is expected beyond what the Discussion provides

**Social Sciences Variant:**
- Structure: Introduction, Theoretical Framework, Methods, Findings, Discussion, Implications/Conclusion
- "Findings" is used instead of "Results" when data are qualitative (coded themes, narrative data)
- The Theoretical Framework section (600-1,500 words) situates the study within a named theoretical tradition (e.g., social learning theory, self-determination theory, grounded theory methodology)
- Implications is sometimes a subsection of Discussion and sometimes a standalone section depending on the journal

**Engineering and Computer Science:**
- Structure: Introduction, Related Work, System Design/Methodology, Evaluation, Discussion, Conclusion
- Related Work is a separate section from Introduction and is typically 500-1,200 words
- Evaluation includes experimental setup, metrics, baselines, and results tables -- it is more detailed than a standard Results section
- Reproducibility statements and code/data availability sections are increasingly required

**Humanities:**
- Structure: Introduction, Literature Review/Theoretical Context, Analysis (multiple sections with thematic or chronological headings), Discussion/Argument, Conclusion
- Section headers are often thematic or argumentative, not functional ("The Rhetoric of Crisis" rather than "Analysis")
- Evidence is textual, archival, or artifact-based; no Methods section in the empirical sense

**Multi-Study Paper (Psychology, Education, Medical):**
- Structure: Introduction, Study 1 (Methods, Results), Study 2 (Methods, Results), [Study 3 if applicable], General Discussion, Conclusion
- Each study must be comprehensible in isolation but contribute to the cumulative argument
- General Discussion integrates findings across studies and addresses limitations of each

### Step 3: Build the Title and Abstract Scaffold

**Title:**
- The ideal research paper title is 10-15 words, specific enough to index correctly in PubMed, PsycINFO, or Google Scholar, and informative enough to communicate the key variable relationship or finding
- Use a declarative or descriptive title, not a question (most journals discourage question titles)
- Include: the key independent variable, key dependent variable or outcome, population, and method if novel (e.g., "A Randomized Trial of...," "A Meta-Analysis of...")
- Avoid: jargon that narrows discoverability, vague words like "investigation of," "study of," "analysis of," starting with "The"
- Strong formula: [Key finding or relationship] + [in/among population] + [using method if noteworthy]
- Examples of weak vs. strong: "A Study of Music and Learning" (weak) vs. "Lyrical Background Music Impairs Reading Comprehension in College Students: A Randomized Experiment" (strong)

**Abstract:**
- For a full journal article: 150-300 words (check target journal -- Nature requires 150, APA journals allow 250, some allow 350)
- Structured abstract (required by many clinical and health journals): Background, Objective, Methods, Results, Conclusions -- each as a labeled paragraph or sentence group
- Unstructured abstract (common in psychology, education): A single paragraph covering the same elements without labels
- The abstract must contain specific findings with effect sizes or key qualitative themes -- never write "Results are discussed" or "Findings are presented"
- Every claim in the abstract must be supported in the paper body -- the abstract is a contract with the reader
- Keywords (5-8): place below the abstract; use controlled vocabulary from the relevant thesaurus (MeSH for medical, Thesaurus of ERIC Descriptors for education, APA Thesaurus for psychology) plus 1-2 specific terms

### Step 4: Structure and Guide the Introduction

The Introduction has a specific rhetorical architecture called the CARS model (Create a Research Space, Swales 1990) that applies across disciplines:

**Move 1 -- Establish the Territory (1-2 paragraphs):**
- Open with a statement of the phenomenon's importance, prevalence, or impact -- grounded in citation
- Demonstrate that the topic is actively researched (cite 5-10 key studies)
- Establish the stakes: why does this matter clinically, socially, theoretically, or practically?
- Avoid opening with a dictionary definition or a sweeping generalization ("Since the dawn of time...")

**Move 2 -- Establish the Niche / Identify the Gap (2-3 paragraphs):**
- Describe what is known -- accurately and specifically, not dismissively
- Identify the specific gap: a methodological limitation in prior work, an untested population, a theoretical contradiction, an unanswered question, a replication need
- The gap must be a genuine absence, not a manufactured one -- reviewers in the field will know
- Use hedged language: "Few studies have..." not "No study has..." (the latter is almost never true)
- Cite the studies that come closest to your question -- showing you know the adjacent work

**Move 3 -- Occupy the Niche (1-2 paragraphs):**
- State the research question(s) or hypotheses explicitly -- numbered if there are multiple
- Describe the study design in one to two sentences
- Preview the paper's contribution: "This study contributes X to the literature by Y"
- Optionally: briefly preview the paper's organization ("Section 2 describes the methods; Section 3 presents results...")

**Introduction length norms:** 600-1,200 words for most journal articles; up to 2,000 in social sciences extended IMRaD papers; never more than 25% of total paper length.

### Step 5: Build the Methods Section with Replication Precision

The Methods section must be detailed enough that a researcher with equivalent expertise could replicate the study without contacting the authors. It is not a narrative about what you did -- it is a technical specification.

**Subsection structure for quantitative/experimental studies:**
- **Participants/Sample:** N (total and per condition), recruitment source, inclusion/exclusion criteria, demographics (age M and SD, sex/gender distribution, relevant characteristics), compensation if any, dropout or attrition rates, power analysis justification for sample size (target power = .80 or .90, alpha = .05, and the effect size assumed -- state the source of the assumed effect size)
- **Materials/Instruments:** Describe every measure, instrument, or stimulus used. For validated scales: full name, original citation, number of items, response scale (e.g., 1 = strongly disagree to 7 = strongly agree), Cronbach's alpha from validation study and from this sample. For stimuli: how selected, counterbalancing, presentation software (e.g., PsychoPy, E-Prime, Qualtrics), timing parameters.
- **Design:** State the design explicitly -- "a 3 (music condition: silence, classical, lyrical) x 2 (passage difficulty: low, high) between-subjects factorial design" -- and identify independent and dependent variables
- **Procedure:** Chronological, step-by-step. Include: consent process, order of tasks, instructions given to participants, timing, debriefing. For experiments: blinding (single, double, or none), randomization method, condition assignment.
- **Data Analysis:** State the statistical tests used and justify them. Include software and version (R version 4.3.1, SPSS version 29, Python 3.11 with SciPy 1.11). State significance threshold (α = .05) and correction for multiple comparisons if applicable (Bonferroni, Benjamini-Hochberg). For qualitative studies: state coding approach (deductive vs. inductive), number of coders, intercoder reliability method (Cohen's kappa, Krippendorff's alpha) and achieved values, and how disagreements were resolved.
- **Ethical considerations:** IRB/ethics board approval number, informed consent process, data anonymization procedures -- required by virtually all journals.

**Methods length norms:** 400-900 words for most experimental studies; up to 1,500 for complex multi-phase or mixed-methods studies; qualitative studies often require more procedural narrative.

### Step 6: Structure the Results Section for Clarity and Completeness

The Results section presents what was found. No interpretation belongs here -- interpretation is the Discussion's job.

**Organizing principle:** Mirror the structure of the research questions or hypotheses stated in the Introduction. If you stated three hypotheses, present results in Hypothesis 1, Hypothesis 2, Hypothesis 3 order. Reviewers track this alignment explicitly.

**For quantitative results:**
- Lead each subsection with a statement of the finding in plain language before presenting statistics
- Report statistics in APA format: F(df1, df2) = value, p = .xxx, η² = .xx; t(df) = value, p = .xxx, d = .xx
- Always report effect sizes: Cohen's d for t-tests, η² or ω² for ANOVA (prefer ω² -- η² is positively biased), r or R² for correlations/regression, OR and RR for binary outcomes in medical research
- Always report 95% confidence intervals alongside point estimates
- Do not describe a result as "significant" without stating the p-value; do not describe it as "trending" (this is not a recognized statistical category)
- Preliminary analyses first: sample characteristics table (Table 1), assumption checks (normality, homogeneity of variance, multicollinearity), manipulation checks if applicable
- Tables: use for 4+ means/values; label as Table 1, Table 2; APA tables have no vertical lines
- Figures: use for interaction effects, distributions, time series; label as Figure 1, Figure 2

**For qualitative results:**
- Organize by emergent themes, not by participant
- Each theme needs: a theme name, a brief description, representative quotations (verbatim, with participant identifier), and the frequency of occurrence across participants
- Quotations must be contextual -- never drop a quote without surrounding interpretive framing
- Saturation: state when and how theoretical saturation was reached

**Results length norms:** Proportional to the number of research questions and complexity of data; typically 800-2,000 words for a standard empirical paper; tables and figures count toward the narrative but have separate space limits in some journals.

### Step 7: Construct the Discussion and Conclusion

The Discussion is the intellectually demanding heart of the paper. It must do five distinct things, and failing to do any of them is a common reason for rejection.

**Discussion architecture:**
1. **Brief restatement of purpose (1 paragraph):** One to three sentences restating what the study set out to do and its key finding -- without merely copying the abstract. "This study examined X among Y using Z and found A."
2. **Interpretation of key findings (2-4 paragraphs):** What do the results mean? Interpret each major finding in relation to the theoretical framework or conceptual model introduced in the Introduction. Explain the mechanism -- not just the pattern.
3. **Comparison to existing literature (2-3 paragraphs):** How do findings align with, extend, or contradict prior work? Cite specific studies. If your results contradict previous findings, explain why -- methodological differences, population differences, moderating variables. This is where you show command of the field.
4. **Limitations (1-2 paragraphs):** Genuine limitations, stated directly. Common categories: sample characteristics limiting generalizability, self-report bias, cross-sectional design preventing causal inference, confounds not controlled, attrition, demand characteristics. Do not be defensive -- acknowledging limitations shows scientific maturity. Do not list limitations as mere caveats -- explain their implications for interpreting findings.
5. **Implications and future directions (1-2 paragraphs):** Practical implications (what should practitioners, policymakers, clinicians do differently?). Theoretical implications (what does this mean for the model or framework?). Future research: 2-3 specific, actionable suggestions (not "future research should examine this further" -- say exactly what design, population, and question would be informative).

**Conclusion:**
- Separate section in extended IMRaD; final paragraph of Discussion in compact IMRaD
- 150-300 words; states the contribution clearly and concisely
- Does not introduce new arguments, new citations, or new data
- Does not repeat the abstract word-for-word
- Ends with the "so what" -- the field-level significance of the contribution

**Discussion length norms:** 800-1,500 words for standard papers; the Discussion should not be longer than the Introduction and Methods combined.

### Step 8: Verify Structural Integrity Before Delivering

Run these alignment checks before delivering the framework:

- **RQ-Method alignment:** Every research question or hypothesis stated in the Introduction is addressed by a specific component of the Methods design
- **RQ-Results alignment:** Every research question or hypothesis has a corresponding Results subsection
- **Results-Discussion alignment:** Every finding discussed in the Discussion appears in the Results -- no new data or results introduced in Discussion
- **Gap-Contribution alignment:** The gap identified in the Introduction is specifically addressed by the study's contribution
- **Claim calibration:** Conclusion language is proportionate to the design -- cross-sectional studies cannot claim causality; single-site studies cannot claim universal generalizability
- **Abstract-body alignment:** Every specific claim in the abstract (effect sizes, sample sizes, key findings) matches the paper body exactly

---

## Output Format

```
## Research Paper Framework: [Working Title]

**Discipline:** [Field and subfield]
**Structure:** [IMRaD / Extended IMRaD / Social Sciences Variant / Engineering / Multi-Study]
**Study Design:** [Experimental / Observational / Qualitative / Mixed-Methods / Computational]
**Target Venue:** [Journal name or "general journal in [field]"]
**Citation Style:** [APA 7th / IEEE / Chicago / Vancouver / etc.]
**Estimated Word Count:** [Total] ([Section breakdown])
**Key Contribution (one sentence):** [What this paper adds that did not exist before]

---

### TITLE
**Proposed title:** [Specific, 10-15 words, includes key variables and population]
**Title rationale:** [Why this title communicates the contribution effectively]
**Alternative title:** [One alternative if the primary reads too narrow or too broad]

---

### ABSTRACT
**Word target:** [150-300 depending on journal]
**Type:** [Structured with labels / Unstructured paragraph]

[Draft abstract or scaffold:]
Background/Context: [1-2 sentences establishing the problem]
Objective: [1 sentence stating the research question]
Methods: [2-3 sentences: design, N, key measures, analysis]
Results: [2-3 sentences: specific findings with effect sizes or key themes]
Conclusions: [1-2 sentences: implications and contribution]

**Keywords:** [5-8 terms, including controlled vocabulary terms from relevant thesaurus]

---

### 1. INTRODUCTION
**Target length:** [600-1,200 words]
**CARS move structure:**

**1.1 Establish the Territory (Paragraphs 1-2)**
- Open with: [specific framing of the phenomenon -- prevalence, importance, theoretical relevance]
- Must cite: [key background references -- suggest 5-8 foundational or recent high-impact sources]
- Establish stakes: [why this matters and to whom]

**1.2 Establish the Niche / Identify the Gap (Paragraphs 3-4)**
- What is known: [summary of the directly relevant prior literature]
- Specific gap: [the precise absence this study addresses -- methodological, population, theoretical, replication]
- Gap language: ["However, few studies have..." / "Prior work has not examined..." / "A critical limitation of existing research is..."]

**1.3 Occupy the Niche (Paragraphs 5-6)**
- Research question(s) or hypotheses [stated explicitly and numbered]:
  - RQ1: [...]
  - RQ2: [...]
  - H1: [...]
- Study overview: [1-2 sentences describing design and approach]
- Contribution statement: ["This study extends X by Y, providing the first Z..."]

---

### 2. METHODS
**Target length:** [400-900 words]

**2.1 Participants / Sample**
- Total N: [number], [per condition if applicable]
- Recruitment: [source, location, method]
- Inclusion criteria: [specific]
- Exclusion criteria: [specific]
- Demographics: [age M = __, SD = __; gender: X% female; relevant characteristics]
- Power analysis: [target power, alpha, assumed effect size, source of effect size estimate]
- Attrition: [dropout N and rate, reason if known]

**2.2 Materials / Instruments**
- [Measure 1 name]: [citation], [N items], [response scale], [α from validation = .xx, α from this study = .xx]
- [Measure 2 name]: [same format]
- [Stimuli if applicable]: [description, selection procedure, software, timing]

**2.3 Design**
- Design statement: [explicit statement of design -- "A 2 (IV1) x 3 (IV2) between-subjects factorial design"]
- Independent variable(s): [list with levels]
- Dependent variable(s): [list with measurement approach]
- Control variables: [list]
- Counterbalancing: [yes/no, method]

**2.4 Procedure**
- [Step-by-step chronological account of what participants experienced]
- Blinding: [single / double / none]
- Randomization method: [computer-generated, stratified, block, etc.]
- Task duration: [total time, per-phase time]
- Debriefing: [yes/no, content]

**2.5 Data Analysis**
- Primary analysis: [statistical test, software, version]
- Significance threshold: α = [.05 / .01 / other, with justification if non-standard]
- Multiple comparisons correction: [Bonferroni / Benjamini-Hochberg / none, with justification]
- Effect size measures: [Cohen's d, η², ω², r, OR -- specify which and why]
- Handling of missing data: [listwise deletion / imputation method]
- For qualitative: coding approach, number of coders, IRR metric and achieved value

**2.6 Ethical Considerations**
- IRB/Ethics approval: [institution, protocol number if known]
- Consent: [written informed, verbal, waiver]
- Data anonymization: [method]

---

### 3. RESULTS
**Target length:** [800-2,000 words]
**Organizing principle:** [Matches RQ order / Hypothesis order / Theme order]

**3.0 Preliminary Analyses**
- Table 1: [Sample characteristics -- demographics and baseline measures]
- Assumption checks: [normality test results, Levene's test, VIF if regression]
- Manipulation check (if experimental): [Did the manipulation work as intended?]

**3.1 [Finding addressing RQ1 / H1]**
- Directional statement: [Plain language finding first]
- Statistics: [Full APA-format statistics: test statistic, df, p, effect size, 95% CI]
- Table/Figure reference: [Table 2 / Figure 1]

**3.2 [Finding addressing RQ2 / H2]**
- [Same structure as 3.1]

**3.3 [Additional findings, exploratory analyses, supplementary results]**
- Label clearly as exploratory or post-hoc if not pre-registered
- State if analyses were planned vs. data-driven

---

### 4. DISCUSSION
**Target length:** [800-1,500 words]

**4.1 Summary of Purpose and Key Findings (1 paragraph)**
- [Brief, non-redundant restatement of study purpose and primary outcome]

**4.2 Interpretation of Key Findings**
- Finding 1 interpretation: [What does the result mean mechanistically? How does it support or challenge the theoretical framework?]
- Finding 2 interpretation: [Same structure]

**4.3 Comparison to Existing Literature**
- Consistent with: [Cite specific aligned studies, explain why they converge]
- Inconsistent with: [Cite specific contradictory studies, explain the discrepancy -- methodology, population, moderators]

**4.4 Limitations**
- Limitation 1: [Specific limitation] -- Implication: [How it affects interpretation or generalizability]
- Limitation 2: [Specific limitation] -- Implication: [How it affects interpretation]
- [Continue as needed -- typically 3-5 limitations]

**4.5 Implications**
- Theoretical: [What model or framework is supported, challenged, or extended?]
- Practical: [What should practitioners / clinicians / policymakers do differently?]
- Future research: [2-3 specific suggestions -- named design, population, or variable]

---

### 5. CONCLUSION
**Target length:** [150-300 words]
- Contribution statement: [What this paper proved, demonstrated, or established]
- Significance: [Why it matters to the field]
- Final sentence: [The enduring takeaway -- calibrated to what the design actually supports]

---

### REFERENCES
**Style:** [APA 7th / IEEE / Chicago / Vancouver]
**Management:** [Cite every source mentioned; use reference management software -- Zotero, Mendeley, or EndNote -- to prevent formatting errors]
**Self-plagiarism check:** [Ensure prior publications by the same authors are cited, not recycled verbatim]

---

### SUBMISSION CHECKLIST
#### Title and Abstract
- [ ] Title is 10-15 words, includes key variables and population
- [ ] Title avoids vague phrases ("study of," "investigation of")
- [ ] Abstract contains specific findings with effect sizes or key themes
- [ ] Abstract does not contain phrases like "results are discussed"
- [ ] Keyword list includes controlled vocabulary terms from relevant thesaurus

#### Introduction
- [ ] Opens with a contextualized, cited statement of the problem
- [ ] Gap is specific and genuine (not manufactured)
- [ ] Research questions or hypotheses are explicitly numbered
- [ ] Contribution is stated clearly

#### Methods
- [ ] Power analysis justifies sample size
- [ ] All measures include reliability (α) from this sample
- [ ] Statistical analysis plan is stated before results
- [ ] IRB approval and consent are documented
- [ ] Methods are detailed enough for replication without author contact

#### Results
- [ ] All research questions have corresponding results subsections
- [ ] Effect sizes are reported for every primary outcome
- [ ] 95% confidence intervals are reported alongside point estimates
- [ ] Tables and figures are numbered and referenced in text
- [ ] No interpretation appears in Results

#### Discussion
- [ ] Every finding interpreted connects to a result in the Results section
- [ ] Limitations address generalizability specifically
- [ ] Future research suggestions are specific (not generic)
- [ ] No new data or results introduced

#### Conclusion
- [ ] Does not overclaim causality if design is correlational
- [ ] Does not copy the abstract
- [ ] Proportionate to the design's actual inferential power

#### Final
- [ ] All in-text citations have a reference list entry
- [ ] All reference list entries are cited in text
- [ ] Word count is within journal limits
- [ ] Sections conform to target journal's author guidelines
- [ ] Figures and tables meet journal resolution and formatting specs
```

---

## Rules

1. **Never allow a mismatch between the Introduction's research questions and the Methods' design.** If the Introduction states "We examined whether X causes Y," the Methods must describe a design capable of supporting causal inference -- a randomized experiment or a natural experiment with appropriate controls. A cross-sectional correlation cannot support "causes."

2. **Never allow new data, new statistics, or new results to appear in the Discussion.** Every empirical claim in the Discussion must be traceable to a specific sentence or table in the Results section. The Discussion interprets; it does not discover.

3. **Never write a Conclusion that overclaims the inferential scope of the design.** Cross-sectional studies "suggest associations," not causes. Single-site studies "provide preliminary evidence," not universal findings. Single-nation studies cannot generalize to "humans" or "people." Pre-registered studies can use stronger inferential language; unregistered studies must be more cautious.

4. **Always report effect sizes alongside p-values for every primary outcome.** Statistical significance (p < .05) does not measure practical importance. A p < .001 with d = 0.08 in a large sample is trivial; a p = .04 with d = 0.62 in a small sample is clinically meaningful. The APA Publication Manual (7th edition) requires effect sizes; journals that do not explicitly require them still expect them.

5. **Always match the structural template to the discipline and study type.** Forcing IMRaD on a humanities analysis paper, a grounded theory study, or a theoretical argument paper produces a paper that is misaligned with reviewer expectations in those fields. The wrong structure signals disciplinary unfamiliarity.

6. **The Methods section must be written for replication, not summary.** If a reader cannot replicate the study using only the Methods section (without emailing the authors), it is insufficiently detailed. Common failures: stating a measure name without citing it; reporting "a questionnaire was used" without describing it; stating "data were analyzed with ANOVA" without specifying the type, factors, or software.

7. **The Introduction gap must be genuine, not manufactured.** Saying "no study has ever examined X" when a dozen studies have examined X is a fatal error that peer reviewers in the field will catch immediately. Instead, identify a genuine methodological limitation, an underexamined population, a theoretical contradiction in the literature, or an untested boundary condition.

8. **Abstract language must reflect actual findings, never coverage.** "This paper explores," "this paper investigates," and "results are presented" are forbidden abstracts phrases. The abstract must state specific findings: effect direction, effect size if quantitative, key themes if qualitative. An abstract is a findings document, not a table of contents.

9. **Limitations must have explanatory depth, not just a list.** Stating "small sample size is a limitation" without explaining how it affects statistical power, confidence intervals, or generalizability adds nothing. Each limitation must be accompanied by its specific implication for interpreting the study's findings.

10. **Pre-registration status must be declared in the Methods.** If the study was pre-registered (OSF, AsPredicted, ClinicalTrials.gov), state the registration number and URL. If it was not, do not hide this -- some journals require disclosure of non-pre-registration. Exploratory analyses conducted after data collection must be labeled as exploratory; presenting them as confirmatory is a form of research misconduct called HARKing (Hypothesizing After Results are Known).

---

## Edge Cases

**The user has results but no structured study and no clear research question:**
Work backward using the "funnel inversion" method. Start with the results: "What pattern do these data show?" Then ask: "What question would these data answer?" Then ask: "What method would one use to answer that question?" Then ask: "What gap in the literature would motivate that question?" Build the paper structure from bottom to top, then flip it into the conventional top-down IMRaD structure. The Introduction must ultimately read as if the research question preceded the results, because intellectually it should have -- help the user identify the genuine question their study was implicitly testing.

**The user is writing a registered report:**
Registered reports flip the conventional structure. The paper is submitted in two stages: Stage 1 (Introduction and Methods only, submitted for pre-study peer review) and Stage 2 (full paper with Results and Discussion, submitted after data collection). Stage 1 must include: the theoretical rationale, hypotheses, full Methods with power analysis, and proposed analysis plan. Stage 2 adds Results and Discussion. Emphasize that any deviation from the pre-registered analysis plan must be explicitly labeled as exploratory or unplanned.

**The user has a multi-study paper with inconsistent findings across studies:**
This is a common and underaddressed scenario. Do not hide the inconsistency. Structure the General Discussion to explicitly address it: present a theoretical explanation for why the studies diverged (different populations, different operationalizations of the IV or DV, different effect size ranges, order effects). A paper that honestly grapples with inconsistent findings across studies is more credible -- and more publishable -- than one that minimizes them.

**The user is targeting a specific high-impact journal with unusual format requirements:**
Some journals deviate significantly from standard IMRaD. Nature and Science require extremely compressed Methods (often moved to supplementary materials), very short Results sections driven by figures, and a single combined "Results and Discussion" section. JAMA and The Lancet require a structured abstract with up to 7 labeled fields. PLOS ONE requires a specific ethical oversight statement. IEEE conference papers have strict two-column, page-limited formats. Always ask for the target journal and check its author guidelines for section names, word limits, figure limits, and formatting specifications before building the framework.

**The user is a non-native English speaker writing for an English-language journal:**
Structural advice remains the same, but flag two additional considerations. First, many high-impact journals now explicitly require language polishing services before submission -- recommend this after the structure is solid. Second, certain rhetorical conventions that feel natural in other academic traditions (extensive hedging, indirect statements of contribution, passive voice throughout) are often poorly received in North American and UK journals. Directness in stating contributions ("This study demonstrates...") is expected, not arrogant, in English-language academic publishing.

**The user's study has a null result (finding of no significant effect):**
Null results are publishable, especially when: the study is adequately powered, the effect size is near zero with tight confidence intervals (providing strong evidence of absence, not absence of evidence), and the null finding is theoretically meaningful. Structure the paper normally but emphasize in the Results that the confidence interval excludes meaningful effect sizes (e.g., "The 95% CI [-.08, .09] excludes effect sizes larger than d = 0.10, providing strong evidence against a practically meaningful effect"). The Discussion should frame this as a positive contribution, not an apology.

**The user needs to convert a conference paper to a journal article:**
Conference papers are typically 6-10 pages (strict) and often omit full Methods detail, complete Results tables, and extended Discussion. A journal expansion requires: expanding the Literature Review and gap identification, adding full statistical reporting with effect sizes and CIs, extending the Discussion to address each finding's theoretical implications in depth, and adding a Limitations section if absent. Warn the user that simultaneous submission of the same work to a journal and a conference venue is a publication ethics violation -- clarify the venue relationship first.

**The user's study involves human subjects but they have no IRB approval:**
Do not proceed with structuring the paper as if it can be published without this. Most journals require IRB or equivalent ethics board approval as a condition of publication (explicitly stated in author guidelines and confirmed at submission). If the study was conducted without approval, the user must: retroactively consult their institution's IRB about whether the study qualifies for exempt status (some retrospective studies, analysis of existing data, and classroom studies may), and disclose the situation. Studies involving human subjects published without ethical oversight documentation are vulnerable to post-publication retraction.

---

## Example

**Input:** "I need help structuring a paper. I ran a study on the effect of background music on reading comprehension among college students. Experimental design, 120 participants randomly assigned to three conditions -- silence, classical instrumental music, and pop music with lyrics. Measured reading comprehension with a validated 20-item test after a 20-minute reading period. Found that classical music had no significant effect (p = .71, d = 0.08) but pop music with lyrics significantly decreased comprehension scores compared to silence (p < .001, d = -0.64). I want to interpret this through the phonological loop account of working memory interference. Targeting Cognition or Journal of Experimental Psychology: General. APA 7th edition. Not pre-registered."

**Output:**

---

## Research Paper Framework: Effects of Background Music Type on Reading Comprehension in College Students

**Discipline:** Cognitive psychology (attention, working memory)
**Structure:** IMRaD
**Study Design:** Randomized three-group between-subjects experiment
**Target Venue:** Cognition or Journal of Experimental Psychology: General
**Citation Style:** APA 7th edition
**Estimated Word Count:** 5,000-7,000 words total (Introduction: 900; Methods: 600; Results: 700; Discussion: 1,200; Abstract: 250)
**Key Contribution (one sentence):** This study provides direct experimental evidence that it is the presence of lyrics -- not music per se -- that disrupts reading comprehension in college students, operationalized through the phonological loop account of working memory interference.

---

### TITLE

**Proposed title:** "Lyrics, Not Music, Disrupt Reading Comprehension: Experimental Evidence for Phonological Loop Interference"

**Title rationale:** The title immediately communicates the key theoretical distinction (lyrics vs. music broadly) and the mechanistic explanation (phonological loop interference), which is the paper's primary theoretical contribution over prior work that conflated all music types. Naming the mechanism increases discoverability by researchers specifically interested in phonological loop research.

**Alternative title:** "The Role of Lyrical Content in Music-Induced Reading Comprehension Impairment: A Randomized Experiment"

---

### ABSTRACT

**Word target:** 200-250 words (Cognition and JEP:G use unstructured abstracts)
**Type:** Unstructured paragraph

Background: College students routinely study with background music, yet the conditions under which music impairs versus leaves unaffected reading comprehension are poorly understood. Existing research has confounded music type with musical presence, leaving unclear whether phonological content -- specifically, the presence of lyrics -- is the operative interference mechanism.

Objective: This experiment tested whether background music disrupts reading comprehension only when it contains lyrics, and whether this effect is consistent with phonological loop interference in working memory.

Methods: 120 undergraduate students were randomly assigned to one of three conditions during a 20-minute standardized reading task: silence, classical instrumental music (Bach Cello Suites), or pop music with lyrics (contemporary top-40 songs). Reading comprehension was measured using a validated 20-item multiple-choice passage comprehension test.

Results: Classical instrumental music produced no significant difference in comprehension relative to silence (d = 0.08, p = .71, 95% CI [-0.28, 0.44]). Pop music with lyrics significantly decreased comprehension scores relative to silence (d = -0.64, p < .001, 95% CI [-0.99, -0.29]), a medium-to-large effect.

Conclusions: The results implicate phonological loop interference -- not arousal or distraction from musical presence per se -- as the mechanism underlying music-induced comprehension impairment. Findings have direct implications for study environment guidance in higher education settings.

**Keywords:** reading comprehension; background music; phonological loop; working memory; cognitive interference; study environments; college students

---

### 1. INTRODUCTION
**Target length:** 850-1,000 words

**1.1 Establish the Territory (Paragraphs 1-2)**

Open with: The ubiquity of music during studying among college students -- cite prevalence data if available (survey studies on student study habits, e.g., Swaminathan & Schellenberg, 2015). Establish that this is not a trivial question: reading comprehension is central to academic performance and is modifiable by environmental variables. Note that the question sits at the intersection of cognitive psychology, educational psychology, and acoustic ecology.

Cite 6-8 background sources covering: the Baddeley working memory model (the phonological loop and visuospatial sketchpad components), existing experimental studies on background music and cognitive performance (the "Mozart Effect" literature and its replication failures, studies on background noise and reading), and the broader irrelevant speech effect literature (e.g., Salamé & Baddeley, 1982, 1989).

**1.2 Establish the Niche / Identify the Gap (Paragraphs 3-4)**

What is known: Prior studies have found mixed effects of background music on cognitive tasks. Some found music impairs tasks requiring verbal processing; others found no effect or facilitative effects for certain music types and tasks.

The specific gap: Prior work has largely treated "music" as a monolithic category, rarely comparing vocal (lyrical) and instrumental music directly within the same experimental design. Studies that have distinguished music types have been limited by small samples (N < 40), unvalidated comprehension measures, or confounding of music type with tempo, loudness, and familiarity. The phonological loop hypothesis -- which predicts that only phonologically loaded stimuli (i.e., vocal speech-like sounds, including lyrics) will interfere with reading, while non-phonological sounds (instrumental music) will not -- has been theorized but not tested with adequate statistical power and ecologically valid materials in a college student sample.

Gap language: "However, existing studies have rarely distinguished between music containing lyrics and purely instrumental music within the same design, leaving unclear whether phonological content specifically -- rather than auditory stimulation broadly -- is the operative mechanism of interference."

**1.3 Occupy the Niche (Paragraphs 5-6)**

Research questions and hypotheses:
- H1: Participants in the pop music with lyrics condition will show significantly lower reading comprehension scores than participants in the silence condition.
- H2: Participants in the classical instrumental music condition will show no significant difference in reading comprehension scores compared to participants in the silence condition.
- Theoretical integration: Both hypotheses are derived from Baddeley's phonological loop model: lyrics engage the phonological loop's articulatory rehearsal mechanism, competing with the phonological processing required for reading, while instrumental music does not access this system.

Study overview: "This experiment used a three-group between-subjects randomized design with 120 college students to directly compare the comprehension effects of lyrical versus instrumental music against a silence baseline."

Contribution statement: "This study provides the first adequately powered experimental comparison of lyrical and instrumental background music on standardized reading comprehension, using materials matched on tempo, loudness, and familiarity, thereby isolating phonological content as the theoretically predicted mechanism of interference."

---

### 2. METHODS
**Target length:** 550-700 words

**2.1 Participants**
- N = 120 undergraduate students (40 per condition)
- Recruitment: [university subject pool or posted flyers -- specify]
- Inclusion: native English speakers (reading comprehension test in English), normal or corrected-to-normal vision, no diagnosed reading or attentional disorders
- Exclusion: professional musicians (>5 years formal training) -- to avoid familiarity with the classical stimuli affecting arousal
- Demographics: Report age (M, SD), gender distribution, year in college
- Power analysis: Target power = .80, α = .05, minimum detectable effect d = 0.45 (conservative estimate based on meta-analytic effect sizes for irrelevant speech effects from Jones & Morris, 1992), computed in G*Power 3.1 -- required N = 33 per group, enrolled 40 per group to account for potential attrition
- Attrition: [Report any]

**2.2 Materials**
- Reading comprehension measure: [Name the validated test used -- e.g., Nelson-Denny Reading Comprehension Test or a published passage comprehension battery]; 20 items, multiple choice, α from validation study = .87, α from this sample = [report]
- Musical stimuli:
  - Silence condition: ambient room noise only (no music playback)
  - Classical instrumental: Bach Cello Suite No. 1 in G Major (BWV 1007), mean tempo = 76 BPM, presented at 65 dB SPL via [headphones or speakers -- specify]
  - Pop with lyrics: [Specify 3-5 songs used, matched on tempo ~76-80 BPM, presented at 65 dB SPL]; lyrics in English
  - Stimulus matching: All music conditions matched on loudness (65 dB, measured with sound level meter), approximate tempo (70-80 BPM), and participant familiarity (assessed via pre-study 7-point familiarity rating -- report M and SD per condition to confirm matching)

**2.3 Design**
- 3 (music condition: silence vs. classical instrumental vs. pop with lyrics) between-subjects design
- Independent variable: Music condition (3 levels)
- Dependent variable: Reading comprehension score (0-20, number correct)
- No within-subjects factors -- using between-subjects to avoid carryover effects from multiple listening exposures

**2.4 Procedure**
- Participants arrived individually or in small groups (max 3 per session) and provided written informed consent
- Pre-study questionnaire: demographics, music familiarity ratings, headphone vs. speaker preference
- Assigned to condition via computer-generated random number sequence (blocked randomization in sets of 6 to ensure equal condition assignment)
- Music (or silence) began playing; participants then read a standardized passage for 20 minutes
- Immediately following reading: completed the 20-item comprehension test (no time limit beyond 10 minutes, timed to prevent extended deliberation)
- Debriefing: Explained the study purpose; disclosed hypotheses

**2.5 Data Analysis**
- Primary: One-way ANOVA (music condition: 3 levels) on comprehension scores; planned pairwise contrasts using Bonferroni correction (α = .0167 per comparison) comparing: (1) lyrics vs. silence, (2) classical vs. silence
- Effect size: ω² for omnibus F; Cohen's d with 95% CI for pairwise contrasts
- Software: R version 4.3.1 (afex package for ANOVA, effectsize package for effect sizes)
- Assumption checks: Shapiro-Wilk test for normality, Levene's test for homogeneity of variance
- Note: All analyses below are exploratory and unplanned (study was not pre-registered) -- H1 and H2 above were formulated before data collection but without formal registration; interpret with appropriate caution

**2.6 Ethics**
- IRB approved by [Institution] IRB, Protocol #[number]
- Written informed consent obtained from all participants
- Data stored anonymously with condition assignment as the only identifier

---

### 3. RESULTS
**Target length:** 600-800 words

**3.0 Preliminary Analyses**
- Table 1: Descriptive statistics -- M and SD for comprehension scores by condition; age, gender, music familiarity by condition
- Assumption checks: Shapiro-Wilk tests for each group (report W and p for each); Levene's test (report F and p)
- Manipulation check on familiarity: Confirm groups did not differ significantly in their familiarity with the musical stimuli used (one-way ANOVA on familiarity ratings)

**3.1 Omnibus ANOVA**
- Report: F(2, 117) = [value], p = [value], ω² = [value], 95% CI [low, high]
- Figure 1: Bar graph or violin plot of mean comprehension scores (with 95% CIs) by condition -- recommend violin plot because it shows score distribution, not just means

**3.2 Hypothesis 1 -- Pop Music with Lyrics vs. Silence**
- "As hypothesized, participants in the pop music with lyrics condition scored significantly lower on the reading comprehension test (M = [xx], SD = [xx]) compared to participants in the silence condition (M = [xx], SD = [xx]), t(78) = [value], p < .001, d = -0.64, 95% CI [-0.99, -0.29]."
- Interpret the CI: The lower bound of the 95% CI excludes effects smaller than d = -0.29, confirming the effect is at minimum small-to-medium in magnitude.

**3.3 Hypothesis 2 -- Classical Instrumental Music vs. Silence**
- "Classical instrumental music did not significantly affect comprehension scores (M = [xx], SD = [xx]) compared to silence (M = [xx], SD = [xx]), t(78) = [value], p = .71, d = 0.08, 95% CI [-0.28, 0.44]."
- Note: The 95% CI extends to d = 0.44 -- the study cannot rule out a small positive or small negative effect of classical music. Acknowledge this in Discussion.

**3.4 Exploratory Analysis (if conducted)**
- If any additional analyses were conducted post-hoc (e.g., moderation by music familiarity, GPA, or self-reported study music habits), label explicitly: "Exploratory analyses, unplanned prior to data collection."

---

### 4. DISCUSSION
**Target length:** 1,000-1,300 words

**4.1 Summary of Key Findings (Paragraph 1)**
"This experiment tested whether background music disrupts reading comprehension as a function of lyrical content, operationalized within Baddeley's phonological loop framework. Results supported both hypotheses: pop music with lyrics significantly impaired comprehension (d = -0.64) while classical instrumental music had no reliable effect (d = 0.08) relative to silence."

**4.2 Interpretation Through the Phonological Loop Account**
- Paragraph 2: Explain the phonological loop mechanism in concrete terms. The articulatory rehearsal loop maintains verbal information through subvocal rehearsal. Lyrics -- as meaningful, sequential phonological sequences -- compete directly with the phonological codes generated during reading, overloading the rehearsal system and reducing the capacity available for comprehension. Instrumental music, which contains no phonological structure, does not load this system.
- Paragraph 3: Address why the effect was medium-to-large (d = -0.64). This may reflect that the 20-minute reading window was sufficient for interference to accumulate, that the pop stimuli used were particularly phonologically dense, or that college-age readers already approach working memory capacity during complex text comprehension. Future work can disentangle these.

**4.3 Comparison to Existing Literature**
- Consistent with: Salamé and Baddeley's (1982, 1989) irrelevant speech effect -- the finding that phonologically structured background noise (speech, sung text) impairs serial recall and verbal tasks more than non-phonological noise. Cite additional more recent replications if available.
- Extends: Prior research on music and cognitive performance by isolating phonological content as the operative variable rather than treating all music as a
