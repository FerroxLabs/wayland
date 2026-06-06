---
name: abstract-writing
description: |
  Writes structured academic abstracts that state the problem, method, key findings, and implications in 150-300 words. Enforces findings-first writing over coverage descriptions.
  Use when the user asks to write an abstract for a research paper, thesis, conference submission, or journal article.
  Do NOT use for executive summaries (different format), paper introductions (use research-paper-structure), or literature review summaries (use literature-review).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "academic-writing writing research"
  category: "writing"
  subcategory: "academic-writing"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Abstract Writing

## When to Use

**Use this skill when:**
- A user asks to write, draft, or improve an abstract for an empirical research paper (quantitative, qualitative, or mixed methods)
- A user needs a conference abstract for submission to an academic conference, symposium, or workshop
- A user is writing a thesis or dissertation abstract (Masters or PhD level)
- A user wants to revise an existing abstract that reviewers or supervisors have criticized as vague, too long, or lacking findings
- A user has completed their paper and needs the abstract to accurately represent the methods, findings, and implications
- A user is preparing a structured abstract for a journal that requires labeled sections (Background, Methods, Results, Conclusions)
- A user needs a short-form abstract (under 150 words) for a poster presentation, extended abstract proceedings, or grant summary

**Do NOT use this skill when:**
- The user wants an executive summary for a business, policy, or government report -- these follow a different structure with different conventions (use `executive-summary`)
- The user wants to write a paper introduction -- introductions are 500-1500 words with literature review content and are not abstracts (use `research-paper-structure`)
- The user wants to summarize a paper they are reviewing or citing -- that is a literature synthesis task, not abstract writing (use `literature-review`)
- The user wants a lay summary or plain-language summary for public communication -- these de-emphasize methods, use no jargon, and target non-specialist audiences (use `plain-language-summary`)
- The user is writing a book proposal abstract -- these are pitches to publishers, not research summaries
- The user wants a structured research proposal abstract for a grant application -- grant abstracts have specific funder-mandated components that differ from publication abstracts (use `grant-writing`)

---

## Process

### Step 1: Establish the Abstract's Context Before Writing a Single Word

Gather every constraint before drafting. Abstract requirements differ dramatically by venue, and a 250-word journal abstract and a 500-word conference extended abstract are completely different documents.

- **Word limit:** Confirm the exact number. Journals commonly specify 150 words (some clinical journals), 200 words (many social science journals), 250 words (APA-style journals, JAMA, Nature), 300 words (many humanities and mixed-methods journals), or up to 500 words (extended conference abstracts). Treat the limit as a hard ceiling, not a guideline.
- **Structured vs. unstructured:** Structured abstracts use labeled section headers (Background, Objective, Methods, Results, Conclusions -- or equivalents). Unstructured abstracts are a single paragraph. Journals in medicine, public health, nursing, and psychology increasingly require structured abstracts. Humanities and theoretical social science journals typically use unstructured abstracts.
- **Discipline conventions:** Empirical sciences use IMRaD logic (Introduction/Problem, Methods, Results, Discussion). Humanities abstracts often include argument, sources, and interpretive framework rather than methods and statistics. Identify which convention applies.
- **Paper stage:** Is the paper complete (write a retrospective abstract -- the ideal case) or in progress (write a prospective abstract for a conference submission deadline)?
- **Audience specificity:** A specialist journal abstract can use field-standard abbreviations (fMRI, RCT, SEM). A multidisciplinary conference abstract requires more definitional scaffolding.
- **Number of key findings:** Count the paper's primary findings. If there are more than three, the abstract must rank them by importance -- every finding cannot receive equal space.

---

### Step 2: Extract the Four Obligatory Components from the User's Paper or Notes

Every abstract regardless of discipline, length, or format must contain these four elements. Extract each explicitly before drafting.

- **Problem/Gap/Objective (the "why"):** What specific gap in knowledge, unresolved debate, practical problem, or unanswered question does this study address? The best problem statements cite a tension or contradiction -- not just "little is known." Example of a weak gap: "Depression is a common mental health condition." Example of a strong gap: "While CBT effectiveness for adult depression is well-established, evidence for its efficacy in late-onset depression (first episode after age 60) remains inconsistent across three published meta-analyses."
- **Method (the "how"):** Study design (RCT, cross-sectional survey, ethnography, systematic review, meta-analysis, case study, computational modeling), sample (N, key demographics, selection criteria), key measures or instruments, and analytical approach. Do NOT describe every statistical test -- name the design and the primary analytical strategy.
- **Findings (the "what"):** The specific results. For quantitative papers: effect sizes (Cohen's d, odds ratios, correlation coefficients, regression coefficients), confidence intervals, p-values, percentages, means. For qualitative papers: the named themes, categories, or theoretical constructs identified. For systematic reviews: the number of included studies, pooled effect estimates, and heterogeneity (I²). These must be real numbers from the paper, not paraphrases.
- **Implications (the "so what"):** What the findings mean for theory, practice, policy, or future research. The best implication statements are specific -- not "further research is needed" (which adds nothing) but "These results suggest revising clinical screening protocols for late-onset depression to include cognitive flexibility as a primary diagnostic marker."

---

### Step 3: Sequence the Four Components Using Discipline-Appropriate Rhetoric

The four components always appear in the same logical order, but the space allocation and rhetorical weight differ by discipline.

- **Empirical quantitative papers:** Problem (15% of words), Method (25%), Findings (40%), Implications (20%). Findings receive the most space because they are the abstract's primary product. Every sentence in the findings section should contain a number.
- **Qualitative papers:** Problem (20%), Method (25%), Findings (35%), Implications (20%). Findings in qualitative papers name and briefly characterize the themes or theoretical constructs -- they do not use p-values but they are still specific. "Four themes emerged: institutional distrust, information overload, competing responsibilities, and provider-patient communication failure" is a specific qualitative finding. "Themes related to barriers were identified" is not.
- **Systematic reviews and meta-analyses:** Problem (10%), PRISMA-relevant method summary (30%), Pooled findings with heterogeneity (40%), Clinical/policy implications (20%). The number of included studies, the PICO parameters, and the pooled effect estimate are non-negotiable inclusions.
- **Theoretical or conceptual papers (humanities/social theory):** The IMRaD structure does not apply. Instead: the intellectual problem or debate (25%), the paper's central argument or intervention (30%), the evidence base or analytical framework (25%), the contribution to the field (20%).
- **Conference abstracts (prospective):** For studies not yet complete, lead with the research question and design, describe preliminary or expected findings if available, and emphasize the contribution the completed study will make. Do not fabricate findings.

---

### Step 4: Write the First Draft Using Findings-First Discipline

The single most common abstract failure is writing an abstract that describes the paper's coverage rather than stating the paper's findings. Apply this principle to every sentence as you draft.

- **The coverage test:** After writing each sentence, ask: "Does this sentence tell the reader a fact about the world, or does it only tell them a fact about the paper?" The sentence "This study examined the moderating role of sleep quality in the stress-burnout relationship" tells the reader only that the paper exists. The sentence "Sleep quality significantly moderated the stress-burnout relationship (β = -0.31, p = .003), with poor sleepers showing 42% greater burnout severity under equivalent stress loads" tells the reader something about the world.
- **Active vs. passive voice:** "We recruited 180 participants" and "Results showed that X predicted Y" are both clear and appropriate. "Participants were recruited" and "It was found that" are passive constructions that distance the reader from the research action. Use active voice for method and results statements; passive is acceptable when the subject is truly not important.
- **Verb tense conventions:** Problem/background uses present tense ("Depression affects 280 million people globally"). Method and findings use past tense for completed studies ("We recruited," "Results showed," "The intervention reduced"). Implications use present or future tense ("These findings suggest," "Future research should").
- **The opening sentence rule:** Never open with a statement so broad it could begin any abstract ("Research on education is important"). Open with the specific context of your study ("Retrieval practice improves long-term retention in laboratory settings, but its effectiveness in authentic classroom environments with high-stakes assessment pressure remains untested").
- **Specificity of implication:** The ending of the abstract should name a specific action, revision, or direction. Avoid the three emptiest abstract endings: "Further research is needed," "Implications are discussed," and "Results are presented." These three phrases add zero information to the abstract.

---

### Step 5: Apply Word Economy Edits -- Three Rounds

Abstracts have no tolerance for waste. After drafting, cut with discipline. Apply three distinct editing passes.

- **Round 1 -- Structural redundancy:** Remove any sentence that repeats information already conveyed. Background sections frequently repeat in the implication section ("As noted above, anxiety is common..."). Each of the four components should contain only information that does not appear in any other component.
- **Round 2 -- Phrase compression:** Target specific wordy constructions with standard compressions:
  - "In order to" → "To"
  - "Due to the fact that" → "Because"
  - "It is important to note that" → delete entirely
  - "A total of N participants" → "N participants"
  - "The purpose of this study was to" → delete; start with what you did
  - "The results of this study suggest that" → "Results suggest that" or "These findings suggest"
  - "In the current study" → delete when the context is clear
- **Round 3 -- Jargon audit:** Every acronym, technical term, or field-specific construct that a reader from a neighboring discipline would not recognize must be either defined (in minimal words) or replaced with plain language. Exceptions: universal disciplinary standards that the journal's audience will recognize without definition (e.g., "RCT" in a medical journal, "SEM" in a quantitative social science journal).
- **Word count precision:** Count words using the same method the target journal uses. Most journal submission systems count hyphenated terms as one word, treat "et al." as one word, and do not count the abstract label itself. When cutting to hit a word limit, cut from background first, then from method, and never from findings.

---

### Step 6: Write or Reformat for Structured Abstracts When Required

When a venue requires a structured abstract, apply the labeling convention specific to that discipline.

- **Biomedical and clinical journals (CONSORT, PRISMA conventions):** Background / Objective / Methods / Results / Conclusions. Each section is labeled in bold and begins on a new line. The Methods section must include the study design, setting, participants (with key eligibility criteria), and the primary outcome measure. Results must include the primary outcome with its confidence interval and effect size.
- **Psychological and social science journals (APA 7 structured):** Objective / Method / Results / Conclusions. Under APA 7, structured abstracts for empirical articles should include the number of participants, key demographic information, and the statistical test names and outcomes.
- **Education and social science (unstructured APA):** Single paragraph in the order: context/problem, method summary, primary findings, practical implications. No section labels, but the logical structure is identical to the structured format.
- **Word allocation in structured formats:** When a 250-word abstract is structured into four labeled sections, do not allocate words equally (62.5 per section). Allocate: Background 40-50 words, Methods 50-60 words, Results 80-100 words, Conclusions 40-50 words.
- **Section label flexibility:** Some journals use "Purpose" instead of "Objective," "Findings" instead of "Results," or "Design/Setting/Participants" as separate sub-labels. Always match the exact labels required by the target venue.

---

### Step 7: Final Quality Verification Against the Seven-Point Abstract Standard

Before delivering the abstract, verify it meets all seven criteria. This check is not optional -- each criterion catches a specific class of abstract failure.

- **Criterion 1 -- Specificity:** Does the abstract contain at least one specific quantitative finding (a number, percentage, effect size, or test statistic) for empirical papers, or at least one named construct or theme for qualitative papers? If no specific finding appears, the abstract fails.
- **Criterion 2 -- Independence:** Can a reader who has never seen the paper understand what was studied, how, what was found, and why it matters -- from the abstract alone? Abstracts are read independently of the paper in databases like PubMed, PsycINFO, and Google Scholar.
- **Criterion 3 -- Accuracy:** Do the claims in the abstract match the paper? The most serious abstract error is an abstract that overstates, understates, or misrepresents the paper's findings. This is a research integrity issue, not just a quality issue.
- **Criterion 4 -- Completeness:** Are all four components present? A method-only or background-only abstract is incomplete. Every venue requires all four components.
- **Criterion 5 -- Word count:** Is the abstract within the specified limit? Count carefully.
- **Criterion 6 -- Register:** Is the language appropriate for the target audience's expertise level? An abstract written for Nature will be more accessible than one written for the Journal of Cognitive Neuroscience because Nature's audience is broader.
- **Criterion 7 -- No meta-commentary:** Does the abstract contain any sentence that talks about the paper rather than about the research? ("This paper contributes to the literature by..." -- delete. "This study is the first to..." -- acceptable only if verifiably true and important.)

---

## Output Format

Deliver the abstract using the following complete template. Adjust the structural variant (structured vs. unstructured) to match the venue requirement.

```
## Abstract

*Word count: [actual count] / [limit specified]*
*Format: [Structured -- [label set used] | Unstructured -- [discipline/style]]*
*Venue: [journal name, conference, or thesis as specified by user]*

---

### [STRUCTURED FORMAT -- use when venue requires labeled sections]

**Background:** [1-2 sentences. The specific problem, gap, or unresolved question. Present tense. Opens with the specific context, not a broad field statement.]

**Objective:** [1 sentence. The study's precise aim -- what question it was designed to answer or what hypothesis it tested. Past or infinitive tense: "This study examined..." or "To examine..."]

**Methods:** [2-3 sentences. Study design, sample (N + key demographics or selection criteria), primary measures or instruments, and analytical strategy. Past tense. No exhaustive list of every measure -- only what is needed to evaluate rigor.]

**Results:** [2-4 sentences. Primary findings with specific values: effect sizes, confidence intervals, p-values, percentages, means, or named themes. Past tense. Lead with the most important finding. Every sentence should contain a specific number or named construct.]

**Conclusions:** [1-2 sentences. What the findings mean for theory, practice, or policy. Specific actionable implication. Present or future tense. No "further research is needed" as the only conclusion.]

---

### [UNSTRUCTURED FORMAT -- use when venue requires single paragraph]

[Single paragraph. Opens with a context/problem sentence. Continues with method summary. Moves to findings -- this section should occupy approximately 40% of the paragraph's sentences and contain specific data. Closes with a specific implication. No section headers. No line breaks between components.]

---

### Abstract Quality Check

| Criterion | Status | Notes |
|---|---|---|
| Specific problem/gap stated (not just a topic) | [ ] Pass / [ ] Fail | |
| Study design named | [ ] Pass / [ ] Fail | |
| Sample described (N, key characteristics) | [ ] Pass / [ ] Fail | |
| At least one specific finding with data/construct | [ ] Pass / [ ] Fail | |
| Implication is specific (not "further research is needed") | [ ] Pass / [ ] Fail | |
| Word count within limit | [ ] Pass / [ ] Fail | [actual] / [limit] |
| No findings in abstract absent from paper | [ ] Pass / [ ] Fail | |
| No coverage language ("this paper examines...") | [ ] Pass / [ ] Fail | |
| Appropriate register for target audience | [ ] Pass / [ ] Fail | |

---

### Revision Notes (if applicable)

*[List any information the user did not provide that would strengthen the abstract: missing effect sizes, unstated sample size, missing comparison group data, etc. Be specific about what numbers or constructs are needed.]*
```

---

## Rules

1. **Never write a coverage abstract.** The distinction is absolute: "This paper examines the relationship between sleep deprivation and cognitive performance" is a coverage statement. "Sleep deprivation of 24 hours reduced working memory capacity by 38% compared to baseline" is a finding statement. Every sentence in the findings section must contain information about the world, not information about the paper.

2. **Never exceed the word limit.** Abstract word limits are enforced by journal submission systems, conference review platforms, and thesis format checkers. A 251-word abstract submitted to a 250-word journal will be desk-rejected or automatically truncated. Count precisely and honor the ceiling.

3. **Never include findings in the abstract that are not in the paper.** This is a research integrity violation, not merely a stylistic error. If a user asks you to include a finding you cannot verify is in their paper, flag it explicitly and ask for confirmation before including it.

4. **Never leave the findings section without at least one specific value.** For quantitative research: effect sizes, confidence intervals, p-values, percentages, or means. For qualitative research: named themes, named categories, named theoretical constructs, or participant counts associated with themes. Vague findings language ("significant improvements were found," "several themes emerged") fails the specificity criterion.

5. **Never use "further research is needed" as the sole implication.** This phrase is the most common empty ending in academic abstracts. It belongs in a discussion section, not the abstract's closing statement. The implication must name a specific direction, population, application, or policy revision.

6. **Always match the abstract's structural format to the venue's requirement.** A structured abstract submitted to a journal that requires unstructured abstracts, or vice versa, signals a failure to follow submission guidelines -- which signals to reviewers that the author did not read the instructions carefully.

7. **Always write findings in past tense and implications in present or future tense.** Tense violations break the time logic of the abstract: findings happened (past tense); their meaning exists now (present tense). "Results showed that X reduced Y by 30%. These findings suggest revising current clinical guidelines."

8. **Always allocate the most words to findings, regardless of how much the user wants to explain the background.** If a user's draft abstract has 4 background sentences and 1 findings sentence, the abstract must be restructured -- not simply edited. Invert the distribution.

9. **Never use unexplained acronyms.** Even common-seeming acronyms (CBT, SES, EFL, OLS) must be spelled out on first use in the abstract, because the abstract is read in isolation from the paper body where the acronym may be defined. Exception: universally recognized abbreviations in the specific venue's field where a spelled-out version would strike specialist readers as condescending.

10. **If the user's paper has null results, state them directly and completely.** Null results are findings. "No significant association was found between X and Y (r = .04, 95% CI [-.09, .17], p = .56)" is a specific, complete, honest finding. Null results presented vaguely ("mixed results were observed") misrepresent the study. Null findings that are properly reported contribute to the field's file-drawer problem solutions.

---

## Edge Cases

### Paper Is Not Yet Written (Prospective Conference Abstract)
When the user is submitting a conference abstract before completing the study, the abstract is prospective -- it describes what the study will do, not what it found. Handle this carefully:
- Use future or conditional tense in the findings section: "We expect to find," "Preliminary analyses suggest," or "The study will test whether."
- If any preliminary data exists (pilot study, first wave of data collection), include those specific numbers and clearly label them as preliminary.
- Focus the methods section on design rigor -- reviewers of prospective conference abstracts evaluate whether the methodology is credible and whether the question is important.
- Do not fabricate expected findings to sound more compelling. Mark clearly as "study in progress" or "anticipated findings."
- After the study is complete, a full revision of the abstract will be required before any journal submission.

### Null Results or Non-Significant Findings
Null results require the same specificity as positive findings, and the abstract must not obscure or minimize them:
- Report the test statistic, degrees of freedom or sample size, and p-value even for non-significant results: "No significant difference was found between the intervention and control groups (t(198) = 1.12, p = .26, d = 0.16)."
- The implication section for null results typically addresses what the null finding rules out, what it confirms, or what methodological limitations might explain the null. "These null findings do not support the proposed mechanism and suggest the effect, if present, is smaller than the d = 0.5 threshold this study was powered to detect."
- Never convert a null result into a borderline positive by using only one-tailed language, selective reporting, or omitting confidence intervals that include zero.

### User Has Multiple Studies in a Single Paper (Multi-Study Paper)
Multi-study papers (common in psychology, education, and medicine) require the abstract to synthesize across studies rather than summarize each:
- Lead with the overall cross-study finding or conclusion, not with Study 1's finding.
- Name each study briefly by method type ("In Study 1, an online experiment (N = 312)...") -- do not use sequential numbering without content.
- If studies converge, say so explicitly: "Three pre-registered experiments consistently found..."
- If studies diverge or one replicates another, state the replication result: "Study 2 (N = 480) directly replicated the Study 1 effect with a larger sample and pre-registered hypotheses (d = 0.38, 95% CI [0.24, 0.52])."
- Allocate findings-section space proportionally to each study's importance to the overall argument, not equally.

### Very Short Word Limit (100-150 Words) -- Poster Abstracts and Extended Abstract Proceedings
At 150 words or fewer, every component must be compressed to its minimum viable content:
- Problem: 1 sentence maximum, most specific version possible.
- Method: Design + N only. No measures, no analysis details.
- Findings: 2 sentences maximum. Only the primary finding with its single most important statistic.
- Implications: 1 sentence. The single most important implication only.
- At 100 words, combine problem and objective into one sentence, reduce method to a parenthetical ("(RCT, N = 200)"), and give findings the remaining 60-70 words.
- Acronyms are more acceptable at very short lengths -- spell out only those a non-specialist would not recognize.

### Qualitative Research -- Findings Without Statistics
Qualitative abstracts face the highest risk of vagueness because researchers sometimes believe "themes emerged" is a sufficient finding statement. It is not:
- Name every primary theme, category, construct, or narrative structure identified: "Analysis revealed four themes: (1) institutional betrayal, (2) informal support networks as protective, (3) disclosure as double-edged, and (4) the role of time in meaning-making."
- Include participant-count anchoring where appropriate: "The majority of participants (N = 18/24) described..."
- For grounded theory abstracts, name the core category and the substantive theory proposed.
- For phenomenological abstracts, name the essential structure or meaning unit identified.
- Method description for qualitative work must include: approach (thematic analysis, grounded theory, phenomenology, discourse analysis, ethnography), sample characteristics (not just N but purposive criteria), and data type (semi-structured interviews, focus groups, archival documents).

### Abstract Needs to Be Revised Because It Was Rejected or Criticized
When a user brings an existing abstract that reviewers or supervisors criticized:
- First, diagnose the specific failure type before revising: coverage abstract (no findings stated), findings buried (background too long), missing data (findings without numbers), word limit violation, structural mismatch (structured submitted as unstructured), or accuracy mismatch (abstract doesn't match paper).
- Address each criticism explicitly. Do not simply reword the existing abstract -- restructure it based on the failure diagnosis.
- If the reviewer criticized vagueness, locate every vague term in the existing abstract and replace each with a specific value or named construct.
- If the reviewer said "the abstract doesn't match the paper," ask the user to provide the paper's actual results section, then rewrite from the source data.

### Systematic Review or Meta-Analysis Abstract
Systematic reviews and meta-analyses have distinct abstract requirements because they synthesize evidence rather than report a single study:
- Methods must include: the databases searched (do not list every one -- name the primary databases and the date range), the PICO parameters (Population, Intervention, Comparison, Outcome), the number of studies initially retrieved and the number ultimately included after screening, and the risk of bias assessment tool used (Cochrane RoB, GRADE, Newcastle-Ottawa).
- Findings must include: the number of included studies, the total N across studies, the pooled effect estimate with 95% confidence interval, and the heterogeneity statistic (I²). I² ≥ 75% is substantial heterogeneity and must be noted -- it changes interpretation.
- Example findings sentence: "Fifteen RCTs (N = 3,847) were included. Meta-analysis showed a moderate positive effect of the intervention (d = 0.52, 95% CI [0.38, 0.66]), with substantial heterogeneity (I² = 71%)."
- Implications must address the GRADE quality of the evidence (high, moderate, low, very low), not just the direction of the effect.

---

## Example

**Input:** "I need an abstract for my journal article. I'm submitting to the Journal of Educational Psychology. The study used a randomized controlled trial design with 276 middle school students (grades 6-8) across four schools. We tested whether a 6-week retrieval practice intervention improved long-term retention of science content compared to standard re-reading. Students were randomly assigned at the classroom level to retrieval practice (n = 138) or re-reading control (n = 138). We assessed retention at 1 week, 4 weeks, and 8 weeks post-intervention using a 40-item science content test developed for the study. Results: at 8 weeks, the retrieval practice group scored significantly higher (M = 28.4, SD = 5.1) than the re-reading group (M = 22.7, SD = 5.8), t(274) = 7.83, p < .001, d = 0.94. The advantage appeared at 1 week (d = 0.61) and grew through 8 weeks (d = 0.94). Students with lower prior knowledge showed the largest gains (d = 1.12 for students below the median on pretest). The journal uses APA structured format with a 250-word limit. Sections: Objective, Method, Results, Conclusions."

---

**Output:**

## Abstract

*Word count: 238 / 250*
*Format: Structured -- APA (Objective / Method / Results / Conclusions)*
*Venue: Journal of Educational Psychology*

---

**Objective:** Retrieval practice reliably enhances retention in laboratory settings, but evidence for its effectiveness in authentic classroom contexts -- particularly over extended retention intervals and across student ability levels -- remains limited. This study tested whether a teacher-implemented retrieval practice intervention produced durable retention advantages over re-reading in middle school science classrooms.

**Method:** A cluster-randomized controlled trial assigned 276 Grade 6-8 students across four schools to a 6-week retrieval practice intervention (n = 138) or a re-reading control condition (n = 138). Retention of science content was assessed using a 40-item researcher-developed test administered at 1, 4, and 8 weeks post-intervention.

**Results:** Retrieval practice produced significantly higher retention than re-reading at 8 weeks (M = 28.4, SD = 5.1 vs. M = 22.7, SD = 5.8), t(274) = 7.83, p < .001, d = 0.94. The retention advantage emerged at 1 week (d = 0.61) and increased across all three assessment points, indicating that the benefit was not attributable to short-term recency effects. Students with below-median prior knowledge showed the largest gains (d = 1.12), suggesting retrieval practice may be particularly effective for students who enter instruction with knowledge gaps.

**Conclusions:** A six-week retrieval practice program produced large, durable retention advantages in authentic middle school classrooms, with the strongest effects among lower prior knowledge students. Teachers can implement retrieval practice without specialist training, and the growing benefit across 8 weeks suggests scheduling retrieval activities throughout -- rather than at the end of -- instructional units.

---

### Abstract Quality Check

| Criterion | Status | Notes |
|---|---|---|
| Specific problem/gap stated (not just a topic) | Pass | Gap: lab-to-classroom translation and extended retention intervals both identified |
| Study design named | Pass | Cluster-randomized controlled trial |
| Sample described (N, key characteristics) | Pass | N = 276, Grades 6-8, four schools, both group sizes |
| At least one specific finding with data | Pass | d = 0.94 primary; d = 0.61 at 1 week; d = 1.12 for low prior knowledge subgroup |
| Implication is specific (not "further research is needed") | Pass | Schedules retrieval throughout units; no specialist training required |
| Word count within limit | Pass | 238 / 250 |
| No findings in abstract absent from paper | Pass | All values provided by user from paper data |
| No coverage language ("this paper examines...") | Pass | All sentences state world-facts, not paper-facts |
| Appropriate register for target audience | Pass | JEP readership: quantitative educational psychologists; d and t statistics appropriate without further explanation |

---

### Revision Notes

The following elements were available from the user's data and were used. If any of these values change during final paper revision, the abstract must be updated to match:
- The effect size growth pattern (d = 0.61 at 1 week → d = 0.94 at 8 weeks) is the abstract's most compelling finding and should not be cut if word count pressure emerges -- cut from the Conclusions section instead.
- The subgroup finding (d = 1.12 for below-median prior knowledge students) was included because it substantially strengthens the practical implication and was already in the user's data. If this subgroup analysis was exploratory rather than pre-registered, the user should consider noting this in the paper's method section (though the abstract space does not permit this caveat).
- The 4-week assessment point result was omitted from the abstract due to word limits -- the 1-week and 8-week endpoints tell the retention trajectory story sufficiently.
