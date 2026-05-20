---
name: academic-paper-review
description: |
  Reviews academic papers for methodological rigor, argument structure, evidence quality, and scholarly conventions. Produces structured peer-review-style feedback with specific, actionable recommendations.
  Use when the user asks for feedback on an academic paper, manuscript review, or scholarly critique of a research document.
  Do NOT use for proofreading academic text (use proofreading), writing a paper from scratch (use research-paper-structure), or responding to peer review comments (use peer-review-response).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "editing academic-writing research"
  category: "writing"
  subcategory: "editing-refinement"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---
# Academic Paper Review

## When to Use

**Use this skill when:**
- A user submits a complete or near-complete academic manuscript and asks for peer-review-style feedback on its merit, rigor, or publishability
- A user wants a structured critique of an empirical study, theoretical paper, systematic review, methods paper, or case study before submission to a journal or conference
- A user asks to evaluate the methodological soundness of a specific section -- such as the sampling strategy, statistical approach, or theoretical framework -- within the context of the full paper
- A user is preparing a thesis chapter or dissertation section for committee review and wants feedback calibrated to that specific academic milestone
- A user has received a rejection or major-revisions decision and wants an independent assessment of whether the reviewers' concerns are valid before responding
- A user is reviewing another scholar's manuscript (e.g., as a formal or informal peer reviewer) and wants help structuring or validating their own review
- A user needs a pre-submission check to anticipate likely reviewer objections before submitting to a specific journal

**Do NOT use this skill when:**
- The user needs only grammar, spelling, and punctuation correction -- use `proofreading` instead
- The user wants to write an academic paper from scratch or structure a new research document -- use `research-paper-structure` instead
- The user wants to draft replies to specific peer reviewer comments already received -- use `peer-review-response` instead
- The user needs citation formatting checked or a reference list corrected -- use `citation-reference` instead
- The user asks only for a summary or explanation of a paper they are reading, not a critique -- use `document-summarization` instead
- The user wants a literature review written for them rather than their existing literature section reviewed -- use `literature-review-synthesis` instead
- The user is asking about research design for a study not yet conducted -- this is methodology consulting, not manuscript review

---

## Process

### Step 1: Establish Review Context Before Reading a Single Line

Before analyzing the manuscript, gather the following parameters. They determine every subsequent judgment.

- **Discipline and subfield:** A psychology paper on cognitive load requires very different standards than a sociology paper on labor precarity. Natural sciences emphasize replicability and falsifiability; humanities emphasize interpretive depth and theoretical coherence; social sciences sit on a spectrum between them. Engineering papers may prioritize practical validation over theoretical generalization.
- **Paper type:** Empirical (quantitative, qualitative, mixed-methods), theoretical/conceptual, systematic review or meta-analysis, methods paper, case study, commentary or perspective, or replication study. Each type has distinct evaluative criteria -- a case study cannot be faulted for lacking a large sample if it correctly frames itself as exploratory.
- **Target venue:** A top-tier journal (Nature, Science, JAMA, APSR, Econometrica) demands higher rigor than a regional conference or disciplinary workshop. Know the difference between Q1 journals, field-specific A* conferences, and student or practitioner publications. If the user names the venue, calibrate accordingly.
- **Developmental stage:** Early draft (argument and structure focus), late draft (everything), pre-submission (anticipate hostile reviewers), post-rejection revision (validate or challenge reviewer critique), thesis/dissertation (committee-appropriate depth).
- **Author's stated goal:** "Make this publishable" is different from "tell me if the argument holds" which is different from "help me understand what the reviewers will object to." Clarify before reviewing.
- **Field-specific conventions:** Certain fields require specific sections (IMRAD structure for biomedical sciences, full reflexivity statements in qualitative sociology, extensive related-work sections in computer science), specific referencing styles (APA, MLA, Chicago, Vancouver, IEEE), and specific norms around authorship, acknowledgment, and ethics statements.

If the user has not provided this context, ask for it. A review without discipline context risks applying the wrong standards.

---

### Step 2: Read for Global Comprehension First -- Not Line-by-Line

Before writing a single evaluative sentence, read the full paper for holistic understanding. This prevents the common reviewer error of flagging local problems without understanding the global argument.

- Identify the **core claim** -- the single most important thing the paper asserts. Write it in one sentence. If you cannot, this is itself a major concern.
- Identify the **primary contribution** -- what does this paper add that does not already exist in the literature? Novelty can be empirical (new data, new phenomenon), methodological (new technique or application), theoretical (new framework or synthesis), or applied (new domain or practice implication).
- Identify the **research question or hypothesis** as explicitly stated, then compare it to what the paper actually investigates. Misalignment between stated question and actual investigation is one of the most common and most serious structural problems.
- Map the **logical chain**: gap in literature → research question → method choice → data collection → analysis → results → interpretation → contribution. Each link must follow from the previous. Note where the chain breaks.
- Note your **first-read impressions** before detailed analysis -- these often correspond to what a real reviewer would react to most strongly.

---

### Step 3: Evaluate the Abstract as a Standalone Document

The abstract is the paper's single most-read section and functions as an independent argument summary. Journals use abstracts for desk rejection decisions. Evaluate it as such.

- **Structured vs. unstructured abstract:** Many journals now require structured abstracts with labeled sections (Background, Methods, Results, Conclusions). If the venue requires this and the paper does not use it, flag it.
- **The five-element test:** A high-quality abstract contains (1) the problem or gap being addressed, (2) the specific research question or objective, (3) the method used, (4) the key quantitative or qualitative results -- not just "results are presented" but actual findings, and (5) the main implication or contribution. If any element is missing, name it.
- **Word count discipline:** Most journals cap abstracts at 150-300 words. Check for violations and for padding -- abstract word count is finite and every sentence must earn its place.
- **No undefined abbreviations or unexplained jargon:** Abstracts are read by editors and reviewers who may not be deep specialists. Undefined technical terms in the abstract are a red flag.
- **Promises vs. delivery:** The abstract must not promise findings the paper does not deliver. Check every claim in the abstract against the actual results section.

---

### Step 4: Audit the Introduction and Literature Review

The introduction and literature review establish the intellectual warrant for the study. Failures here undermine everything downstream.

- **The gap-claim test:** The introduction must demonstrate a specific, non-trivial gap in existing knowledge -- not "this topic has not been studied" (too vague) but "prior studies have examined X using method Y in context Z, but no study has examined X in context W, which matters because..." Flag introductions that claim novelty without specifying the precise gap.
- **Citation recency and depth:** In fast-moving fields (neuroscience, machine learning, epidemiology), cite primarily within the last 5 years with seminal older works. In slower-moving fields (classical history, pure mathematics), older foundational works are appropriate. A literature review citing only sources older than 10 years in an active field is a red flag.
- **Synthesis vs. annotation:** A strong literature review synthesizes sources thematically -- grouping by finding, argument, or methodology -- rather than listing papers sequentially ("Smith found X. Jones found Y. Brown found Z."). An annotated bibliography masquerading as a literature review is a common weakness in student and early-career work.
- **Self-citation bias:** If more than 30-40% of references are from the same author group, flag potential self-citation inflation. This is a known problem in certain subfields.
- **The theoretical framework:** Does the paper ground itself in an established theoretical framework, and is that choice justified? A study of organizational behavior should situate itself within relevant theory (agency theory, social capital theory, institutional theory) rather than operating atheoretically. Flag papers that apply a framework mechanically without examining its fit.
- **Research question precision:** The research question must be specific enough to be falsifiable or answerable. "What are the effects of social media?" is not a research question. "Does Instagram use frequency predict self-reported body dissatisfaction in women aged 18-25 after controlling for pre-existing eating disorder risk?" is a research question.

---

### Step 5: Conduct a Rigorous Methodology Audit

Methodology is the single most scrutinized section in empirical peer review. Evaluate it using the specific standards of the paper's methodological tradition.

**For quantitative research:**
- **Sample size and power:** Was an a priori power analysis conducted? For most behavioral research, adequate power (β = 0.80) for detecting a medium effect (Cohen's d = 0.5) requires approximately 64 participants per group. For small effects (d = 0.2), this rises to ~394 per group. Undersized studies cannot reliably detect effects; oversized studies may detect trivial effects as statistically significant.
- **Sampling strategy and representativeness:** Convenience samples (undergraduate students, MTurk workers, single organization) severely limit generalizability. The paper must acknowledge this. If the sample is convenience-based, check whether the conclusions are appropriately hedged.
- **Measurement validity:** Are the measures validated instruments or ad hoc scales? Validated scales (e.g., PHQ-9 for depression, Big Five Inventory for personality) should be cited with their psychometric properties. Novel scales must report internal consistency (Cronbach's α ≥ 0.70 is the common threshold), test-retest reliability, and ideally factor structure.
- **Statistical assumptions:** Check whether required assumptions are tested -- normality for parametric tests, homogeneity of variance for ANOVA, multicollinearity for regression (VIF < 10, ideally < 5), independence of observations. Violations that are not addressed or acknowledged are a major concern.
- **Effect sizes vs. p-values:** A paper reporting only p < 0.05 without effect sizes (Cohen's d, η², r, OR, β) is methodologically incomplete. Statistical significance without effect size tells you nothing about practical importance. Conversely, large effect sizes with p > 0.05 in underpowered studies may reflect real effects obscured by inadequate sample size.
- **Multiple comparisons correction:** Studies running multiple statistical tests without correction (Bonferroni, Benjamini-Hochberg, FDR) inflate the false-positive rate. Each test at α = 0.05 gives a 5% false-positive rate; 20 uncorrected tests yield approximately 1 false positive by chance alone.
- **Confound control:** Are plausible confounding variables identified and controlled for statistically (regression covariates, propensity score matching) or by design (randomization, matching)?

**For qualitative research:**
- **Paradigmatic consistency:** The methodology must be internally consistent. A phenomenological study should follow phenomenological analysis (IPA, Giorgi method); grounded theory requires theoretical sampling and constant comparative analysis; ethnography requires extended field presence. Applying quantitative concepts like "representativeness" to purposive qualitative samples reflects a category error.
- **Trustworthiness criteria:** Qualitative rigor is assessed through Lincoln and Guba's criteria -- credibility (member checking, prolonged engagement, peer debriefing), transferability (thick description), dependability (audit trail), and confirmability (reflexivity statement). Check whether the paper addresses these.
- **Sample sufficiency:** Qualitative sample sizes should be justified by saturation, not by convention. Thematic saturation in interview studies typically occurs between 12-20 participants for homogeneous samples; heterogeneous samples may require more. Papers reporting 5 interviews as "sufficient" without saturation discussion require scrutiny.
- **Reflexivity:** Qualitative researchers must account for their positionality -- how their identity, assumptions, and prior knowledge shaped data collection and interpretation. A qualitative paper without a reflexivity section or statement is methodologically incomplete in most social science and humanities traditions.
- **Analytic transparency:** The reader should be able to trace how raw data (interview transcripts, field notes, documents) were transformed into themes or categories. Papers that jump from "we collected data" to "we found three themes" without describing the analytic process fail basic transparency standards.

**For systematic reviews and meta-analyses:**
- **PRISMA compliance:** Systematic reviews should follow the PRISMA (Preferred Reporting Items for Systematic Reviews and Meta-Analyses) 2020 checklist. A PRISMA flow diagram showing screening stages is expected.
- **Search strategy reproducibility:** The search strategy must be reported in enough detail to be replicated -- specific databases searched, search terms and Boolean operators used, date ranges, language restrictions, inclusion/exclusion criteria.
- **Risk of bias assessment:** Studies included in a meta-analysis should be assessed for quality/risk of bias using validated tools (Cochrane Risk of Bias tool for RCTs, Newcastle-Ottawa Scale for observational studies, ROBIS for systematic reviews). Failure to do this is a major methodological gap.
- **Heterogeneity:** Meta-analyses must report statistical heterogeneity (I² statistic). I² < 25% indicates low heterogeneity; 25-75% moderate; > 75% high. High heterogeneity may render a pooled effect size misleading and requires subgroup analysis or narrative synthesis.
- **Publication bias:** Check for funnel plot asymmetry, Egger's test, or sensitivity analyses addressing the file-drawer problem. A meta-analysis that does not address publication bias is incomplete.

---

### Step 6: Evaluate Results and Discussion Sections

- **Results neutrality:** The results section must present findings without interpretation. Analysis belongs in the discussion. A results section that editorializes ("This surprising finding suggests...") confounds the two sections.
- **Tables and figures:** Every table and figure must be interpretable standalone -- with title, labeled axes, units, and notes. Data presented in both tables and prose without additional insight is redundant. Figures must add something that prose or tables do not.
- **Discussion scope:** The discussion must interpret results in light of the research question (not restate results), situate findings in the existing literature (how do they confirm, challenge, or extend prior work?), and acknowledge limitations honestly and specifically.
- **Limitations section quality:** Vague limitations ("larger samples are needed") are unhelpful. Specific limitations name the exact threat to validity, explain its magnitude and direction (does it inflate or deflate the effect?), and explain why it could not be fully addressed. A strong limitations section actually strengthens reviewer confidence.
- **Contribution clarity:** The paper must explicitly state what it contributes and why that contribution matters. This should appear in the discussion/conclusion and be traceable back to the gap identified in the introduction. If the stated contribution does not match the gap, flag the misalignment.
- **Overgeneralization:** Claims must be scoped to the sample and context studied. A study of 200 university students in the United States cannot conclude "humans tend to..." or "people generally..." without extraordinary evidence. Every overclaim of generalizability is a major concern.

---

### Step 7: Assess Ethics, Transparency, and Scholarly Integrity

These elements are increasingly required by journals and are legitimate review concerns.

- **Ethics approval:** Empirical research involving human participants should report IRB (Institutional Review Board) or equivalent ethics board approval with an approval number or statement. Animal research requires IACUC or equivalent. The absence of an ethics statement is a publishability barrier at most journals.
- **Informed consent:** Human subjects research should confirm that informed consent was obtained. If data are archival, secondary, or publicly available, this should be stated.
- **Data availability:** Many journals now require a data availability statement. Does the paper indicate where the data can be accessed, or justify why it cannot be shared (confidentiality, proprietary)?
- **Pre-registration:** In psychology, medicine, and increasingly other fields, pre-registration of hypotheses and analysis plans (via OSF, ClinicalTrials.gov, AsPredicted) is valued because it distinguishes confirmatory from exploratory analysis. If the paper is not pre-registered and makes confirmatory claims, flag the absence.
- **Conflict of interest:** Does the paper disclose funding sources and potential conflicts of interest? Industry-funded studies showing positive results for the funder's product warrant scrutiny.
- **Acknowledgments:** Are contributors who do not meet authorship criteria appropriately acknowledged?

---

### Step 8: Synthesize and Structure the Review

After completing the analysis, structure feedback in a formal peer review format.

- Write the **summary first** -- this demonstrates to the author that you understood their work before critiquing it. A summary that misrepresents the paper is a reviewer failure.
- Separate **major concerns** (the paper cannot be accepted as-is without addressing these) from **minor concerns** (should be addressed but would not alone preclude acceptance). This distinction matters enormously to authors and editors.
- Calibrate **recommendation language** precisely. Most journals use: Reject, Major Revision, Minor Revision, Accept with Revisions, Accept. "Major Revision" typically means the paper could be published if the authors address the identified concerns to the reviewer's satisfaction at re-review. "Reject" typically means the fundamental design, dataset, or framing cannot be fixed through revision.
- Every concern must contain: (1) the specific location (section, paragraph, or page), (2) the precise problem, (3) why it matters (impact on validity, contribution, or interpretability), and (4) a concrete recommendation.
- Frame feedback constructively. Peer review exists to improve scholarship, not to gate-keep based on personal preference. Hostile or dismissive tone is not more rigorous -- it is less useful.

---

## Output Format

```
## Academic Paper Review

**Paper Title:** [Full title as given]
**Discipline / Subfield:** [e.g., Organizational Behavior / Industrial-Organizational Psychology]
**Paper Type:** [Empirical -- Quantitative Survey / Theoretical / Systematic Review / etc.]
**Target Venue (if known):** [Journal name, conference, thesis committee]
**Review Stage:** [Pre-submission / Post-rejection revision / Thesis draft / etc.]
**Recommendation:** [Reject | Major Revision | Minor Revision | Accept with Revisions | Accept]

---

### Summary
[2-4 sentences stating: what the paper investigates, what method it uses, what it finds, and what it claims to contribute. This must demonstrate genuine understanding of the paper's purpose before any critique.]

---

### Core Contribution Assessment
[1-2 sentences assessing whether the stated contribution is real, novel, and adequately scoped. State explicitly whether the paper succeeds in filling the gap it identifies.]

---

### Strengths
1. [Specific strength, with reference to section/element -- e.g., "The cross-organizational sample design (Section 3.1) substantially improves generalizability relative to prior single-site studies."]
2. [Specific strength]
3. [Specific strength]
4. [Optional: additional strength]
5. [Optional: additional strength]

---

### Major Concerns
*(Issues that must be resolved before the paper can be accepted)*

**Concern 1: [Descriptive Title]** -- [Section/Page reference]
- **Issue:** [Precise description of the problem]
- **Why it matters:** [How this affects validity, contribution, or interpretability]
- **Recommendation:** [Specific, actionable suggestion -- not just "improve this" but how]

**Concern 2: [Descriptive Title]** -- [Section/Page reference]
- **Issue:**
- **Why it matters:**
- **Recommendation:**

[Continue for all major concerns -- typically 2-6 for a major-revision recommendation]

---

### Minor Concerns
*(Issues that should be addressed and would strengthen the paper, but do not alone prevent acceptance)*

1. [Section reference] -- [Issue] -- [Suggested fix]
2. [Section reference] -- [Issue] -- [Suggested fix]
3. [Section reference] -- [Issue] -- [Suggested fix]
[Continue as needed]

---

### Section-by-Section Notes

| Section | Assessment | Specific Comment |
|---|---|---|
| Title | [Strong / Adequate / Needs revision] | [Comment] |
| Abstract | [Strong / Adequate / Needs revision] | [Comment] |
| Introduction | [Strong / Adequate / Needs revision] | [Comment] |
| Literature Review | [Strong / Adequate / Needs revision] | [Comment] |
| Methodology | [Strong / Adequate / Needs revision] | [Comment] |
| Results | [Strong / Adequate / Needs revision] | [Comment] |
| Discussion | [Strong / Adequate / Needs revision] | [Comment] |
| Conclusion | [Strong / Adequate / Needs revision] | [Comment] |
| References | [Strong / Adequate / Needs revision] | [Comment] |
| Ethics / Transparency | [Present / Absent / Incomplete] | [Comment] |

---

### Methodological Scorecard
*(For empirical papers only)*

| Element | Status | Notes |
|---|---|---|
| Sample size / power justification | [Adequate / Inadequate / Not reported] | |
| Sampling strategy | [Probability / Convenience / Purposive -- appropriate for design?] | |
| Measurement validity | [Validated instruments / Novel scales with psychometrics / Ad hoc] | |
| Statistical assumptions tested | [Yes / Partial / No] | |
| Effect sizes reported | [Yes / No] | |
| Confound control | [Yes / Partial / No] | |
| Multiple comparisons correction | [Applied / Not applicable / Missing] | |
| Ethics approval | [Present / Absent / Not required] | |
| Data availability statement | [Present / Absent] | |

---

### Overall Assessment
[3-5 sentences. State: (a) the paper's core strength and why the topic matters, (b) the most critical issues that must be resolved, (c) the path to acceptance or publication-readiness, and (d) a candid assessment of whether the paper is close or far from publishable in the stated venue.]
```

---

## Rules

1. **Never issue a vague concern.** Every concern must identify the specific section (e.g., "Section 3.2, paragraph 4"), the precise problem (e.g., "Cronbach's α is reported for the overall scale but not for the three subscales"), and a concrete fix (e.g., "Report α for each subscale separately, as subscale-level reliability determines whether they can be used as distinct predictors"). Vague comments like "the methodology needs more detail" are not acceptable.

2. **Never apply cross-disciplinary standards inappropriately.** Do not require a qualitative ethnography to have a large random sample, do not require a historical analysis to have a hypothesis, and do not require a theoretical paper to have empirical data. Evaluate the paper against the standards of its own methodological tradition, not against the template of a different one.

3. **Always write the summary before any evaluative statement.** The summary demonstrates that you have understood the paper's purpose and argument. A critique without demonstrated comprehension is not credible peer review -- it is uninformed judgment.

4. **Always separate major from minor concerns.** Authors and editors need to know what is a deal-breaker versus what is a suggestion. Conflating them in a single list forces authors to guess at priorities, which is an imposition of the reviewer's failure on the author's time.

5. **Never recommend rejection without clearly naming the specific, irremediable flaw.** Rejection is appropriate when the fundamental design, dataset, or core argument cannot be salvaged through revision. If the problems are addressable through revision, the appropriate recommendation is Major Revision, not Reject. Misusing the Reject recommendation suppresses legitimate research.

6. **Always distinguish between statistical significance and practical significance.** A statistically significant finding (p < 0.05) may have a trivially small effect size (d = 0.05, r = 0.02). A paper that treats p < 0.05 as evidence of a meaningful effect without reporting effect sizes is methodologically incomplete, and this must be flagged.

7. **Never dismiss a paper for not studying what the reviewer wished it studied.** Scope is the author's prerogative. A paper focused on a narrow question answered well is more publishable than a broad question answered poorly. Critique what the paper does, not what it does not do -- unless the absent element is essential to the stated contribution (e.g., a paper claiming causal inference without a causal design).

8. **Always calibrate recommendation to the target venue.** A paper that would be a desk reject at Nature Methods might be an accept with minor revisions at a regional field journal. Recommendation must be venue-specific. If the user has not named a venue, state the recommendation in general terms and flag that venue choice matters.

9. **Always flag the top 1-2 most important issues early and prominently.** Authors and editors read reviews selectively. Burying the most critical concern in item 7 of a list is an act of reviewer obscurantism. The most important concern should be named in the recommendation section or at the top of the major concerns list.

10. **Maintain strict proportionality between concern severity and language intensity.** A missing effect size is not "a fundamental flaw in the research design." A study that tests a causal hypothesis with a purely correlational cross-sectional design and draws causal conclusions is a fundamental flaw. Use precise, calibrated language -- overstatement of small problems and understatement of large ones both fail the author.

11. **Never review ethics violations lightly.** If the paper reports research on human subjects without an ethics statement, if it uses a dataset that appears to violate data use agreements, or if its analysis has characteristics of p-hacking (reporting 12 tests with three significant results and no correction), these must be elevated to major concerns, not treated as minor formatting issues.

12. **Always acknowledge field-specific norms around authorship, acknowledgment, and positionality.** In qualitative research, reflexivity is not optional. In clinical research, CONSORT or STROBE reporting standards carry significant weight. In computational research, code availability is increasingly expected. Apply the relevant reporting standard for the paper's type and field.

---

## Edge Cases

**1. The paper is a qualitative study and the user wants quantitative-style rigor applied.**
Some users -- particularly those trained in quantitative traditions -- ask for evaluation of qualitative work using quantitative criteria (e.g., "Is the sample large enough to be statistically significant?"). These are category errors. Explain that qualitative rigor is assessed through Lincoln and Guba's trustworthiness criteria (credibility, transferability, dependability, confirmability), not sample size or statistical power. Evaluate the qualitative paper on: theoretical saturation, analytic transparency, thick description sufficient for transferability judgment, and reflexivity. If the user insists, explain why applying quantitative criteria to qualitative work misunderstands both.

**2. The paper is in a highly technical domain you cannot fully assess.**
If the paper involves highly specialized methodology -- quantum error correction protocols, neuroradiological imaging analysis, advanced econometric identification strategies, clinical pharmacokinetics -- acknowledge the domain-specific limitation explicitly. Review what you can assess with confidence: argument structure, introduction quality, discussion logic, writing clarity, and general methodological transparency. Flag the specific technical elements that require domain expert review. Never fabricate domain expertise you do not have -- false confidence in a peer review is more dangerous than acknowledged limitation.

**3. The user is reviewing someone else's paper as a journal referee and wants help structuring their review.**
This is a legitimate and important use case. Treat the user as the reviewer and help them articulate their own judgment clearly. Ask what their overall assessment is, what their top 2-3 concerns are, and what the paper's genuine strengths are. Help them translate those assessments into precise, actionable review language. Do not override their evaluation -- your role is to help them communicate their expert judgment more clearly, not to substitute your judgment for theirs.

**4. The paper has strong empirical results but is very poorly written.**
Distinguish clearly between communication quality and intellectual quality. A paper with genuinely novel findings and rigorous methodology but poor prose can almost always be published -- the writing can be fixed. A paper with elegant prose and weak findings or flawed methods cannot be papered over with good writing. Flag the writing quality honestly, provide specific examples of unclear passages, and recommend the author seek editorial support or use revision strategies (active voice, topic sentences, paragraph-level argument structure). But ensure the recommendation reflects the intellectual merit of the findings, not the prose quality.

**5. The paper appears to have methodological problems that could indicate data fabrication or selective reporting.**
This is a serious concern that must be handled carefully. Signs include: means and standard deviations that are inconsistently scaled across similar measures, effect sizes that are uniformly just above conventional significance thresholds across many tests, impossibly round numbers in reported frequencies, or results that contradict the study's own reported descriptive statistics. Do not accuse the authors of fraud -- this is a determination for editors and institutional review boards. Do flag, specifically and neutrally, the specific numerical inconsistencies as concerns requiring clarification. Recommend that the editor request the raw data for independent verification.

**6. The user asks for a review of an undergraduate or master's thesis chapter with no journal publication intent.**
Adjust both criteria and language. Undergraduate work is evaluated against learning outcomes, not publication standards. Focus on: whether the student demonstrates understanding of the relevant literature, whether they can construct and sustain an argument, whether they appropriately connect their method to their question, and whether their interpretation is logically defensible. Frame concerns as developmental feedback ("consider adding...", "this would be strengthened by...") rather than the adversarial framing of journal peer review. Still be honest -- a weak argument or a logical flaw in a thesis is not acceptable regardless of level, but the bar for methodological sophistication is calibrated to the degree level.

**7. The paper spans two or more disciplines in ways that make standard criteria difficult to apply.**
Interdisciplinary papers are genuinely difficult to review and are frequently rejected by specialist reviewers who apply narrow disciplinary standards. Evaluate the paper's interdisciplinary claim explicitly: Does it integrate perspectives from both fields in a substantive way, or does it use one field's vocabulary superficially? Does it meet the methodological standards of its primary empirical tradition? Is it targeted at a venue that welcomes interdisciplinary work? Flag if the paper is trying to satisfy two disciplinary audiences simultaneously -- this is a common submission strategy failure that results in the paper satisfying neither audience fully.

**8. The paper was previously rejected and the user shares the rejection decision alongside the manuscript.**
Read the rejection decision carefully alongside the manuscript. If the rejection reason was desk rejection (scope, format, word count) these are often fixable without fundamental revision and your review can focus on the resolvable issues. If the rejection reason was methodological or argued the contribution was insufficient, assess whether the concern is valid. If you agree with the reviewer's critique, say so clearly -- it is more helpful to the author to confirm a valid critique than to encourage them to dismiss it. If you believe the reviewer made an error or applied inappropriate standards, explain specifically why, with reference to the norms of the field.

---

## Example

**User input:** "Please review my paper. It's an empirical study on the effect of remote work on employee productivity, using a cross-sectional survey of 500 employees across 10 companies in the financial services sector. I'm targeting the Journal of Applied Psychology. I've included the full abstract, introduction, methods section, results, and discussion."

**Full Output:**

---

## Academic Paper Review

**Paper Title:** "Remote Work Frequency and Employee Productivity: A Cross-Organizational Survey in Financial Services"
**Discipline / Subfield:** Organizational Behavior / Industrial-Organizational Psychology
**Paper Type:** Empirical -- Quantitative Cross-Sectional Survey
**Target Venue:** Journal of Applied Psychology
**Review Stage:** Pre-submission
**Recommendation:** Major Revision

---

### Summary

This paper investigates the relationship between remote work frequency (measured as days per week worked outside the office) and self-reported employee productivity in a cross-sectional survey of 500 employees drawn from 10 financial services firms. The authors find a statistically significant positive association between remote work frequency and productivity scores, moderated by supervisor trust, and conclude that organizations should expand remote work options to improve workforce output. The study benefits from a multi-organization design and a theoretically grounded moderation hypothesis, but its reliance on a single self-report productivity measure, the cross-sectional design, and unaddressed self-selection present substantial validity challenges that limit the strength of the causal claims.

---

### Core Contribution Assessment

The paper addresses a timely question with practical relevance, and the moderating role of supervisor trust adds theoretical depth absent from much prior work on remote work outcomes. However, the contribution is constrained by the self-report productivity measure and the cross-sectional design -- the paper can establish correlation, not causation, and the discussion section currently overstates the evidence base when it recommends policy change. Repositioning the contribution as exploratory or confirmatory-correlational, rather than causal, would more accurately represent what the design supports.

---

### Strengths

1. **Multi-organization sample design** (Section 3.1): Sampling 500 employees across 10 distinct financial services firms is a meaningful design strength. Single-organization studies are common in remote work research and face severe generalizability limitations. The ten-organization design substantially broadens the empirical base and allows for firm-level random effects modeling, which the authors appropriately use.

2. **Theoretically motivated moderation hypothesis** (Section 2.3): The inclusion of supervisor trust as a moderator is grounded in social exchange theory and follows directly from prior theoretical work on remote work outcomes. This is a more sophisticated design than simple main-effect tests of remote work, and the moderation hypothesis is clearly derived from theory rather than added post-hoc.

3. **Validated measurement instruments** (Section 3.3): The use of the three-item supervisor trust scale from Mayer and Davis (1999) and the organizational productivity scale from Griffin et al. (2007) -- both with established psychometric properties -- is appropriate. The authors correctly report Cronbach's α for each scale (α = 0.81 and α = 0.78, respectively), meeting the conventional 0.70 threshold.

4. **Attention to sector-specific context** (Section 1.2): The deliberate focus on financial services, rather than a generalized cross-sector sample, is methodologically defensible and practically meaningful. Financial services has specific regulatory, confidentiality, and client-interaction constraints that meaningfully affect the remote work-productivity relationship, and the paper contextualizes the findings within that sector appropriately.

5. **Adequate sample size for main effect detection** (Statistical power: Section 3.5): The authors report conducting an a priori power analysis (G*Power 3.1) targeting β = 0.80 to detect a medium effect (f² = 0.15) in hierarchical regression, yielding a required N of 92 at α = 0.05. With N = 500, the study is well-powered for the primary analysis. However, this is not examined for the moderated regression, where power requirements are higher (see Major Concern 2).

---

### Major Concerns

**Concern 1: Self-reported productivity is a methodologically weak dependent variable for the claims made** -- Section 3.3 and Discussion

- **Issue:** Employee productivity is measured entirely through self-report using a seven-item scale. Employees who work remotely may systematically overstate their productivity to justify or preserve their remote work arrangements -- a form of social desirability bias with a specific directional prediction. No objective productivity measures (output volume, project completion rates, quality control metrics, supervisor assessments) are included, even for a validation subset.
- **Why it matters:** If remote workers overstate productivity relative to office workers due to desirability bias, the observed positive correlation between remote work frequency and productivity scores would be inflated, possibly substantially. This is not a speculative concern -- multiple studies in the organizational psychology literature document exactly this pattern. The authors acknowledge this briefly in the limitations section (one sentence, final paragraph), which is insufficient given that it is the most serious threat to the paper's core claim.
- **Recommendation:** The authors have two viable paths. First, if organizational data permits, supplement self-report with even a partial objective performance measure (supervisor-rated performance, sales figures, call resolution rates for a subset) and test whether the relationship holds in that subsample. Second, if objective data are unavailable, restructure the limitations section to lead with this concern rather than bury it, use language in the results and discussion that consistently qualifies findings as "self-reported productivity perceptions" rather than "productivity," and frame the contribution as documenting employee perceptions rather than objective output. The current discussion language ("our findings suggest organizations can increase productivity by expanding remote work") is not supportable by self-report data and must be revised.

---

**Concern 2: The cross-sectional design does not support the causal language used in the discussion** -- Discussion, Sections 4.2-4.4

- **Issue:** The study is cross-sectional: all data were collected at a single time point. Despite this, the discussion uses directional causal language throughout ("remote work increases productivity," "supervisor trust drives the relationship," "expanding remote work will yield productivity gains"). Cross-sectional correlational data establishes association, not causation. The temporal precedence and isolation of confounds required for causal inference are absent from this design.
- **Why it matters:** Journal of Applied Psychology has a high methodological bar, and reviewers will flag causal overclaiming in a cross-sectional design immediately. More importantly, the recommendation for organizational policy change based on cross-sectional self-report data is not empirically warranted -- organizations acting on this advice may implement remote work expansion without the expected productivity gains, or may see gains driven by unmeasured factors (employee autonomy preferences, job type suitability) rather than the remote work itself.
- **Recommendation:** Audit every sentence in the discussion section for causal language and convert to associational language ("is associated with," "predicts in this sample," "is positively related to"). Explicitly acknowledge the cross-sectional limitation as a primary constraint on causal inference, not just as a brief caveat. Reframe the practical implications as: "These findings are consistent with the hypothesis that remote work frequency is positively associated with productivity, and support the case for longitudinal or experimental research to establish causality before strong policy recommendations can be made."

---

**Concern 3: Self-selection into remote work arrangements is unaddressed** -- Section 3 and Discussion

- **Issue:** In this sample, employees were not randomly assigned to remote work frequencies -- they selected (or were assigned by managers) into their current arrangements. Employees who work remotely more frequently may differ systematically from those who work in-office more frequently on unmeasured variables that also predict productivity: intrinsic motivation, autonomy preference, job suitability for remote work, digital literacy, or home environment quality. The paper does not test for, acknowledge, or attempt to address this selection threat.
- **Why it matters:** If high-productivity employees self-select into remote work (or managers allow high-performers more flexibility), the observed positive association reflects a selection effect, not a remote-work effect. This is the single most common methodological critique of observational remote work research and will almost certainly be raised by Journal of Applied Psychology reviewers.
- **Recommendation:** At minimum, add observable covariates that proxy for selection -- prior performance ratings (if available), job autonomy as rated by job type, and individual-level preference for remote work measured by a validated scale. Preferably, conduct a propensity score analysis to identify the remote-work effect after matching on observable selection determinants. If neither is possible with the current dataset, add a dedicated paragraph in the limitations section that explicitly names the selection threat, theorizes its likely direction and magnitude, and discusses how future longitudinal or quasi-experimental designs could address it.

---

**Concern 4: Power analysis does not account for moderated regression** -- Section 3.5

- **Issue:** The a priori power analysis was conducted for main-effects hierarchical regression (Step 1 and Step 2). It was not conducted for the moderated regression in Step 3, which tests the supervisor trust by remote work frequency interaction. Detecting interaction effects requires substantially larger samples than detecting main effects -- typically three to four times larger for a medium-sized interaction term. With N = 500, the study is likely adequately powered for the interaction if the true effect is medium-sized, but this should be demonstrated, not assumed.
- **Why it matters:** An underpowered test of moderation has high false-negative risk. If the interaction is significant at N = 500 but the power analysis for moderation was not conducted, the reviewer has no basis for evaluating whether the finding is reliable or the result of capitalizing on a false positive.
- **Recommendation:** Conduct a supplemental power analysis for the moderated regression using the observed interaction effect size (f² for the R² increment from Step 2 to Step 3), report it in Section 3.5 alongside the original power calculation, and discuss whether the study was adequately powered for moderation detection. This is a straightforward addition that directly addresses a predictable reviewer objection.

---

**Concern 5: The discussion does not engage substantively with contradictory evidence** -- Section 4

- **Issue:** The remote work productivity literature is genuinely mixed. Several well-powered studies -- including Bloom et al.'s (2015) randomized controlled trial in a Chinese call center, subsequent studies in financial services contexts, and research documenting collaboration and knowledge-transfer costs of remote work -- find null or negative productivity effects, or find heterogeneous effects by job type and organizational culture. The current discussion cites only supporting evidence, treating the positive finding as confirmatory of a settled relationship rather than one data point in a contested literature.
- **Why it matters:** A discussion that ignores contradictory evidence signals either incomplete literature coverage or selective citation. Both are serious scholarly concerns. Journal of Applied Psychology will expect a nuanced treatment of the mixed evidence base.
- **Recommendation:** Add a paragraph explicitly engaging with contradictory findings. Speculate theoretically on why results differ across studies -- the financial services context, the role of supervisor trust as a moderator, the specific task types common in financial services -- and position this paper's contribution as clarifying boundary conditions rather than resolving the question. This reframing is both more accurate and more compelling as a contribution.

---

### Minor Concerns

1. **Section 3.4 -- Remote work frequency measurement:** Remote work frequency is measured as a single self-reported item ("On average, how many days per week do you work outside the office?"). A single item is adequate for a factual behavioral frequency question, but the authors should note that this measures intended or recalled behavior, not actual logged behavior, and that recall bias may introduce measurement error. Add one sentence acknowledging this.

2. **Section 4.3 -- Table 3 formatting:** Table 3 (moderation results) does not include confidence intervals for the interaction term, only the β coefficient and its p-value. Journal of Applied Psychology editorial guidelines strongly prefer confidence intervals alongside β coefficients. Add 95% CIs for all regression coefficients in Table 3.

3. **Abstract -- Missing effect size:** The abstract reports the main finding as "a significant positive relationship between remote work frequency and productivity (β = 0.24, p < 0.001)" but does not report the effect size in a metric that communicates practical significance (ΔR², f²). Add the incremental R² contributed by remote work frequency after controlling for covariates so readers can assess practical importance from the abstract alone.

4. **Introduction, paragraph 3 -- Citation gap:** The claim that "remote work has expanded to encompass over 30% of the global workforce since 2020" cites a single industry report (Gartner, 2022). This is a significant factual claim that warrants corroboration from peer-reviewed sources or multiple data sources. Add at least one peer-reviewed citation and specify whether the 30% figure refers to full-time remote workers, hybrid workers, or some other classification.

5. **Section 3.2 -- Ethics statement:** The paper does not include an IRB approval statement or ethics review reference. Journal of Applied Psychology requires confirmation of ethics board approval for human subjects research. Add the approval body, approval reference number, and a statement that participants provided informed consent.

---

### Section-by-Section Notes

| Section | Assessment | Specific Comment |
|---|---|---|
| Title | Adequate | Accurately descriptive; could be more specific about the moderation component to signal theoretical contribution |
| Abstract | Needs revision | Missing effect size for practical significance; productivity measure should be qualified as "self-reported" |
| Introduction | Strong | Gap identification is specific and well-documented; research questions are clearly stated |
| Literature Review | Adequate | Theoretical grounding is solid but contradictory evidence is underrepresented |
| Methodology | Needs revision | Validated measures and multi-org design are strengths; power analysis gap and ethics statement missing are significant |
| Results | Strong | Clear presentation; tables are readable; multilevel model is appropriate for nested data |
| Discussion | Needs revision | Causal language throughout is inconsistent with cross-sectional design; contradictory literature underengaged |
| Conclusion | Needs revision | Policy recommendation overstates what the evidence supports |
| References | Adequate | Reasonably current; should add peer-reviewed sources for the 30% workforce claim |
| Ethics / Transparency | Absent | No IRB statement -- required by the target journal |

---

### Methodological Scorecard

| Element | Status | Notes |
|---|---|---|
| Sample size / power justification | Partial | Power analysis conducted for main effects but not moderation |
| Sampling strategy | Convenience -- requires acknowledgment | Ten-organization design improves on single-org; not probability sample |
| Measurement validity | Validated instruments | Both scales have established psychometric properties; α reported |
| Statistical assumptions tested | Adequate | Multilevel model assumptions discussed; multicollinearity reported (VIF < 3) |
| Effect sizes reported | Partial | β coefficients reported; ΔR² present in text but missing from abstract |
| Confound control | Partial | Covariates included but self-selection not addressed |
| Multiple comparisons correction | Not required | Focused hypothesis set; not a concern for this design |
| Ethics approval | Absent | Must be added before submission |
| Data availability statement | Absent | Required by JAP; add statement on data sharing or non-sharing rationale |

---

### Overall Assessment

This paper addresses a genuinely important question with a well-powered, multi-organizational sample and a theoretically motivated moderation design -- real strengths that distinguish it from much of the remote work literature. The multilevel modeling approach is appropriate for the data structure, and the supervisor trust moderator adds substantive depth. However, the paper's current framing presents correlation as causation, and the discussion recommendations outpace what a cross-sectional self-report design can support -- two concerns that will draw immediate critical response from Journal of Applied Psychology reviewers. The self-selection confound, in particular, is a threat the paper must address analytically or theoretically before submission, as it is the single most predictable objection to observational remote work research. With careful revisions -- specifically, removing causal language, leading with the self-report productivity limitation, adding a propensity score or covariate analysis for selection, conducting a moderation power analysis, and adding the required ethics statement -- this paper has genuine potential for acceptance at Journal of Applied Psychology or a comparable outlet. The revisions required are substantial but achievable without additional data collection.
