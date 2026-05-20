---
name: peer-review-response
description: |
  Drafts structured responses to peer review comments for academic journal submissions, addressing each reviewer point with specific revisions, rebuttals, or explanations.
  Use when the user asks to respond to peer review feedback, write a revision letter, address reviewer comments, or prepare a resubmission response.
  Do NOT use for writing the peer review itself (use academic-paper-review), revising the paper content (use the appropriate writing skill), or general editing (use copy-editing).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "academic-writing writing editing"
  category: "writing"
  subcategory: "academic-writing"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---
# Peer Review Response

## When to Use

**Use this skill when:**
- The user has received peer review comments from a journal and needs to write a formal response letter for resubmission (minor revision, major revision, or revise-and-resubmit decisions)
- The user wants to draft a point-by-point rebuttal to specific reviewer comments, including methodology critiques, interpretive challenges, or requests for additional analyses
- The user needs to write a cover letter to the editor accompanying a revised manuscript, summarizing what changed and why
- The user has received a "reject with invitation to resubmit" decision and needs to structure a response that frames the paper as substantially revised
- The user is navigating contradictory reviewer instructions and needs help deciding which recommendation to follow and how to justify that choice
- The user needs to respectfully but firmly disagree with a reviewer and must build an evidence-based rebuttal without damaging the relationship with the editorial board
- The user has received a "revise and resubmit" at a second journal after being rejected elsewhere and needs to selectively incorporate comments from the first rejection into the new submission
- The user needs help organizing 30+ reviewer comments across multiple reviewers into a manageable, strategic response plan

**Do NOT use this skill when:**
- The user wants to write a peer review of someone else's paper -- use `academic-paper-review` instead
- The user wants to revise the actual manuscript content -- use the appropriate domain writing skill for the discipline (e.g., scientific-writing, humanities-paper-revision)
- The user needs general copy-editing of an existing response letter -- use `copy-editing`
- The user is writing a response to a conference paper review (the format, stakes, and conventions differ significantly from journal peer review)
- The user is responding to a book proposal review from a publisher (different conventions, no line numbers, different power dynamics)
- The user is writing a grant resubmission response -- use `grant-resubmission-response` if available, as NIH/NSF summary statements follow different rules
- The user is responding to a post-publication comment or letter to the editor (use `letter-to-editor`)

---

## Process

### Step 1: Audit and Classify Every Reviewer Comment Before Drafting Anything

This step is diagnostic, not generative. Do not begin drafting responses until the full scope of the review is understood.

- Extract every discrete comment from every reviewer, including inline editorial comments if provided. A single paragraph from a reviewer often contains 2-4 distinct issues -- separate them.
- Assign each comment a unique identifier: R1.1, R1.2, R2.1, R2.2, etc. (Reviewer number dot sequential comment number). This notation must be used consistently throughout the response letter.
- Classify each comment along two dimensions: **type** and **response posture**.
  - Type: Major concern (affects conclusions or validity), Minor concern (improves clarity or completeness), Clarification request (reviewer misunderstood something), Methodological objection, Positive feedback (acknowledge briefly)
  - Response posture: Full agreement with revision, Partial agreement with negotiated revision, Respectful disagreement with evidence, Factual correction of reviewer error (rare, handle delicately)
- Flag cross-reviewer duplicates: when two reviewers raise the same concern, treat the revision as a single change but acknowledge both reviewers in the response. This signals to the editor that the concern was taken seriously.
- Identify the single most dangerous comment in each review -- the one that, if not handled perfectly, could lead to rejection. This comment deserves disproportionate attention in the response.
- Note any comments that would require new data, new analyses, or substantial new sections. These drive the revision timeline and may require a preliminary email to the editor before full revision.

### Step 2: Develop a Strategic Response Posture for the Entire Letter

Before writing individual responses, assess the overall tone and framing of the response letter.

- Determine the decision type and calibrate accordingly:
  - **Minor revision:** Tone is warm and efficient. Show that all concerns are addressable. Keep responses concise (1-3 sentences per minor comment). Editors want to accept the paper -- don't create new problems.
  - **Major revision:** Tone is substantive and thorough. Demonstrate genuine intellectual engagement with the criticism. Reviewers expect to see real changes, not cosmetic ones.
  - **Revise and resubmit (R&R, borderline):** Tone is ambitious. Frame the response as a substantially improved paper, not a defended version of the original. Open the cover letter with the most impressive revision.
  - **Reject with invitation to resubmit:** Treat as a new submission. The response letter becomes an extended cover letter explaining transformation, not defense.
- Identify whether the reviewer base leans toward a particular methodological tradition (e.g., positivist vs. interpretivist in social science, frequentist vs. Bayesian in statistics, mechanistic vs. ecological in biology). Tailor the framing of methodological justifications accordingly.
- Decide on the disagreement budget: aim to disagree with no more than 20-30% of substantive comments. Disagreeing with too many comments signals either poor original scholarship or an author unwilling to engage. Disagreeing with zero comments is also suspicious -- it suggests the author is just appeasing the reviewer.
- Plan the revision cross-reference system before writing: decide whether to use page/line numbers (preferred when the journal provides them), section numbers, or paragraph identifiers. Use one system only and apply it consistently throughout the entire letter.

### Step 3: Write the Editor Cover Letter First

The cover letter frames everything that follows. It is what the editor reads before deciding whether to send the paper back to reviewers.

- Address the editor by name if known. "Dear Editor" is acceptable but "Dear Dr. [Name]" is preferred.
- Open with a brief expression of thanks -- one sentence only. Excessive gratitude reads as sycophantic.
- State the manuscript ID number, the original title, and if the title has changed in revision, note both.
- In 2-4 sentences, describe the most significant changes made. These should match the major concerns raised. If Reviewer 2 asked for an additional analysis and you ran it, say so here, not buried in the response.
- If you are disagreeing with any comments, mention this briefly and frame it positively: "We have addressed all of the reviewers' major concerns. In two cases, we respectfully maintain our original approach but provide substantially expanded justification."
- If the revision required substantial additional work (new data, new analyses, significant restructuring), name that work explicitly. Editors need to know the revision was real.
- End with a one-sentence statement of confidence and availability: "We believe the revised manuscript substantially addresses all concerns raised, and we are available to provide any further clarification the editor or reviewers may require."
- Keep the cover letter to one page or fewer for minor revisions, two pages for major revisions.

### Step 4: Write the Point-by-Point Response -- Agreement and Revision Cases

For every comment where you agree (partially or fully), follow this sub-structure precisely:

- **Quote the comment verbatim** in italics or a blockquote. Never paraphrase -- editors check the original review. Truncation is acceptable for very long comments but must be signaled with "[...]".
- **State the response type in bold** at the start of your reply: "We agree." / "We partially agree." / "We thank the reviewer for this observation." Do not bury the response type in prose.
- **Describe what was changed** before explaining why the change was made. Authors typically reverse this, leading to long justification before the editor can verify that a change occurred at all.
- **Provide the exact location** of the revision: page number, line numbers in the revised manuscript. If the journal does not use line numbers, use paragraph counts from the section header (e.g., "Methods section, paragraph 3").
- **Quote or paraphrase the revised text** for any substantive change. For minor wording changes, quoting is mandatory. For structural changes (added section, reordered analysis), summarize the new content in 2-4 sentences.
- For partially agreed responses, explicitly state what you did and did not do: "We have adopted the reviewer's suggestion to add a robustness check (p. 12, lines 4-9) but have retained the original primary analysis because [reason], consistent with [citation or methodological standard]."
- Use transitional phrases that signal intellectual engagement, not compliance: "The reviewer correctly identifies a gap in our discussion..." / "This is a well-taken point that led us to reconsider..." rather than "As suggested by the reviewer, we have..."
- For minor changes (comma corrections, awkward phrasing), group them into a single "Minor Revisions" section rather than itemizing each one. This keeps the letter readable.

### Step 5: Write the Point-by-Point Response -- Disagreement Cases

Disagreements require significantly more care and evidence than agreements. A poorly written disagreement is the most common reason revised papers are rejected.

- **Never open a disagreement with the word "However" or "Unfortunately."** This reads as oppositional. Open instead by finding genuine merit in the concern: "The reviewer raises an important question about X. We have considered this carefully and believe our original approach is defensible for the following reasons."
- Structure the disagreement using the **ACE framework**: Acknowledge (the legitimate basis for the concern), Counter (the specific evidence or reasoning that supports your position), Explain (how the reader of the paper will understand this, i.e., what text you added to address the confusion without changing the substance).
- Cite published literature to support your position whenever possible. A disagreement backed by 3-4 citations from the target journal's own publication record is far more persuasive than an unsupported argument.
- For methodological disagreements, cite the original methodological paper (e.g., the paper that introduced the technique), a recent application in a high-impact journal, and if possible, a methodologist's handbook or textbook.
- For interpretive disagreements, acknowledge that multiple interpretations are plausible, explain why yours is better supported by the data, and offer to add language to the paper that acknowledges the alternative interpretation. This is usually sufficient.
- Add text to the manuscript in disagreement cases. Even when you are right, add a footnote, a sentence in the limitations, or a clarification in the methods. This shows the reviewer that their concern prompted genuine engagement. "We disagree and have added the following sentence to the discussion..." is almost always better than "We disagree and no revision was made."
- Never write: "We believe the reviewer misunderstood our paper." Write instead: "Our original presentation of this point was apparently unclear; we have added [specific text] to p. X to prevent this misreading."

### Step 6: Handle Cross-Reviewer Issues, Conflicts, and Meta-Comments

Multiple reviewers create coordination challenges that require deliberate handling.

- **Duplicate concerns:** When two reviewers raise the same issue, write a single response and cite both: "This concern was raised by both Reviewer 1 (R1.3) and Reviewer 2 (R2.1). We have addressed it as follows..." Do not write two separate identical responses -- this looks like padding.
- **Contradictory reviewer instructions:** This is common and expected. Do not pretend the contradiction does not exist. Name it explicitly: "Reviewer 1 (R1.4) suggested we expand the theoretical framework section, while Reviewer 2 (R2.3) suggested we shorten it. We have followed Reviewer 1's suggestion because [reason consistent with the journal's editorial scope]. We have streamlined other parts of the introduction to partially accommodate Reviewer 2's concern about length."
- **Reviewer overreach:** Reviewers sometimes ask authors to cite their own work, to change the paper's thesis, or to conduct an entirely different study. Address these comments with maximum respect and minimum concession. For citation requests, add the citation only if it is genuinely relevant. For thesis-change requests, reframe your defense as a clarification: "We appreciate the reviewer's interest in X angle. Our paper is specifically focused on Y, which we have clarified in the introduction (p. 2, lines 1-5). We agree that the X angle represents an important future direction, which we have noted in the conclusion."
- **Positive comments:** Acknowledge them in one sentence. "We thank Reviewer 1 for their positive assessment of [specific element]." Do not spend paragraph space on this.
- **Reviewer comments on previous versions of the manuscript not submitted to this journal:** This occasionally occurs when reviewers have seen preprints or working papers. Address the current submission only.

### Step 7: Compile the Summary Revision Table and Completeness Check

The summary table and completeness check are quality-assurance tools, not cosmetic additions.

- Build a revision table listing every substantive change made to the manuscript. Columns: Revision Description | Section and Location in Revised MS | Prompted by (R#.#) | Type of Change (Added / Deleted / Modified / Moved).
- For minor revisions (5 or fewer reviewer comments), the table may be omitted. For major revisions with 15+ comment points, the table is essential and should appear at the beginning of the response letter after the cover letter, not at the end.
- Run a completeness check: count the total number of discrete reviewer comments and verify that each has a named response in the letter. A response letter that addresses 14 of 15 comments will often result in another round of revision or rejection.
- Verify that every page/line number cited in the response matches the revised manuscript. Mismatched numbers are a common error when authors make last-minute changes -- verify after the final manuscript version is locked.
- Check that the tone is consistent throughout. Response letters are often written over multiple sessions, and the tone in responses written late at night often differs from those written in the morning. Read the full letter aloud or use a consistent revision pass to standardize register.
- Verify that the letter is formatted consistently: all reviewer quotes in the same style (italics, blockquote, or bold), all response labels in the same format, all location references in the same notation system.

### Step 8: Final Quality Pass -- Anticipating the Second Review

Before finalizing, adopt the perspective of the reviewer reading the response letter.

- For each disagreement, ask: "If I received this response as the reviewer, would I feel that my concern was genuinely engaged?" If no, revise.
- For each agreement, ask: "Can the reviewer verify that this change was made from the information I've provided?" If no, add more specificity.
- Ask: "Is there any comment where my response sounds annoyed, condescending, or dismissive?" If yes, revise. The word "clearly" (as in "our paper clearly explains...") almost always sounds condescending -- remove it.
- Ask: "Does the overall letter demonstrate that the paper is better for having gone through review?" The answer should be yes, and this should be legible from reading the letter alone.
- Check the length: a minor revision response should be 1-4 pages. A major revision response may be 5-15 pages for a heavily commented paper. A response that exceeds 20 pages for a single-paper submission is too long -- consolidate.

---

## Output Format

```
## Response to Reviewers

**Manuscript ID:** [Journal-provided ID, e.g., JXXX-2024-0123]
**Original Title:** [Title as submitted]
**Revised Title (if changed):** [New title, or "Unchanged"]
**Decision Received:** [Minor Revision / Major Revision / Revise and Resubmit]

---

### Cover Letter to the Editor

Dear Dr. [Editor Last Name],

We are grateful to you and the reviewers for the careful evaluation of our manuscript,
"[Title]" (Manuscript ID: [ID]). We have completed a [minor/major] revision that
addresses all of the concerns raised.

The most significant changes include: [2-3 sentence summary of the most important
revisions, naming the specific changes and their location in the manuscript].

[If any disagreements:] In two cases, we respectfully maintain our original approach,
but we have substantially expanded our justification in the manuscript and provide
detailed explanation in the response letter below.

We believe the revised manuscript is substantially strengthened by this process.
We are available to provide any further clarification required.

Sincerely,
[Author names]
[Institution]
[Date]

---

### Summary of Revisions

| # | Revision | Location in Revised MS | Prompted by | Type |
|---|----------|------------------------|-------------|------|
| 1 | [Specific change] | [p. X, lines Y-Z] | R1.2 | Added |
| 2 | [Specific change] | [p. X, lines Y-Z] | R2.1, R2.3 | Modified |
| 3 | [Specific change] | [p. X, lines Y-Z] | R1.5 | Deleted |
[Continue for all substantive revisions]

---

### Response to Reviewer 1

We thank Reviewer 1 for their thorough and constructive engagement with our manuscript.
We have addressed each comment below.

---

**R1.1**

> *"[Verbatim reviewer comment quoted in full or with truncation indicated by [...]]"*

**Response: We agree.**

[Description of what changed.] [Specific location: p. X, lines Y-Z.]

[Quote or paraphrase of revised text, indented:]

> *[Revised text as it now appears in the manuscript, or summary of structural change]*

---

**R1.2**

> *"[Verbatim reviewer comment]"*

**Response: We partially agree.**

[Explain what you did and what you did not do, in that order.] [Location of revision.]

[For the part you did not do:] We respectfully retain [specific element] because
[specific reasoning]. This is consistent with [citation / methodological standard /
precedent in the field]. We have added the following text to [location] to clarify
this for readers: "[Added text]."

---

**R1.3**

> *"[Verbatim reviewer comment]"*

**Response: We respectfully disagree, but have revised the manuscript to address
the underlying concern.**

[Acknowledge the legitimate basis for the concern. Then provide the counter-argument
with citations.] Specifically, [Lastname, Year; Lastname, Year] demonstrate that
[supporting evidence]. [Explain why your approach is defensible.]

To ensure that readers understand our reasoning, we have added the following
clarification to [location in manuscript]: "[Added text]."

---

[Continue R1.4, R1.5, etc. for all Reviewer 1 comments]

---

### Response to Reviewer 2

We thank Reviewer 2 for their detailed comments. We note that several concerns
overlap with those raised by Reviewer 1; where this occurs, we indicate the shared
response below.

---

**R2.1** *(Also raised in R1.2 -- see response above for full details)*

> *"[Verbatim comment]"*

**Response: We agree.** [Brief reference to the shared response and revision location.]

---

**R2.2**

> *"[Verbatim comment]"*

**Response: We agree.**

[Response following same format as above]

---

[Continue for all Reviewer 2 comments]

---

### Response to Reviewer 3 (if applicable)

[Same format]

---

### Completeness Check

| Reviewer | Total Comments Received | Comments Addressed | Agreed / Partial / Disagreed |
|----------|------------------------|--------------------|------------------------------|
| Reviewer 1 | [n] | [n/n] | [n] / [n] / [n] |
| Reviewer 2 | [n] | [n/n] | [n] / [n] / [n] |
| Reviewer 3 | [n] | [n/n] | [n] / [n] / [n] |

- [ ] All reviewer comments addressed (no comments skipped)
- [ ] All agreed-upon revisions made in revised manuscript
- [ ] All page/line numbers verified against final revised manuscript version
- [ ] Tone consistent throughout (no defensive or dismissive language)
- [ ] Reviewer quotes match original review text verbatim
- [ ] Summary revision table complete and accurate
```

---

## Rules

1. **Never skip a reviewer comment, including positive feedback.** Editors count comments against responses. A response letter that silently omits even one minor comment may trigger a return for further revision or, in some editors' practice, signals author carelessness and increases rejection risk.

2. **Never write "The reviewer misunderstood our paper."** Even when literally true, this formulation antagonizes the reviewer and the editor. The correct framing is always: "Our original text was apparently unclear on this point; we have revised [location] to prevent this misreading." The author is always responsible for clarity.

3. **Never agree to a revision without making it.** The cardinal failure mode: a response letter says "We have added a sensitivity analysis" but the revised manuscript contains no such analysis. Editors and reviewers check. This produces immediate rejection or a trust-destroying third round of revision.

4. **Never provide a response location reference before the final manuscript is locked.** Page and line numbers shift with every edit. Write the response letter last, after the final version of the manuscript is complete, and cross-check every reference.

5. **Do not use hedging language when stating what changed.** "We attempted to clarify..." / "We tried to address..." / "We somewhat expanded..." -- these phrases signal that the revision may be inadequate. Use declarative statements: "We added...", "We deleted...", "We restructured..."

6. **Do not disagree with more than 30% of substantive comments without a strong strategic reason.** A response letter that disagrees with the majority of reviewer comments reads as defensive and unwilling to engage. Before rejecting a reviewer's suggestion, ask whether a partial concession can satisfy the concern while preserving the key element you are defending.

7. **Quote the reviewer verbatim -- never paraphrase.** Paraphrasing introduces subtle distortions that can make the reviewer's concern appear weaker than it was, which the reviewer will notice in their second-round review. Verbatim quotation builds trust with both the reviewer and the editor.

8. **Calibrate response length to comment severity.** Major methodological concerns warrant 3-8 sentences of response with citations and quoted revised text. Minor wording suggestions warrant 1-2 sentences. A 6-sentence response to a comma suggestion signals poor judgment. A 2-sentence response to a fundamental validity challenge signals dismissiveness.

9. **For papers with multiple authors, designate one author to own the response letter draft and circulate it to co-authors for approval before submission.** Response letters that are drafted by committee without a final integrating edit are tonally inconsistent and often contradict each other's framing.

10. **Always read the journal's specific instructions for revised submissions before finalizing the response.** Some journals require specific formatting (numbered comments, colored tracked changes, specific cover letter structure). Some journals do NOT want a separate response letter -- they want responses embedded as cover letter text or tracked-change annotations. Submitting in the wrong format creates avoidable delays.

11. **Do not use sarcasm, irony, or rhetorical questions in a response letter.** The statement "One might wonder how the reviewer arrived at this conclusion" ends careers. So does "Perhaps the reviewer missed Table 3, which addresses this point directly." Academic writing operates with a veneer of collegial respect even when the author is furious -- maintain it absolutely.

12. **For statistical or methodological objections, report specific numbers, not just conclusions.** "Our sample is adequate" is not a defense. "Our sample (n = 50) provides 80% power to detect d = 0.40 at α = .05, consistent with the effect sizes reported in Chen (2020) and Park & Lee (2021)" is a defense. Numbers make arguments credible.

---

## Edge Cases

### Contradictory Instructions from Two Reviewers
When Reviewer 1 wants the theory section expanded and Reviewer 2 wants it cut, do not pretend the conflict does not exist -- editors are well aware that reviewers sometimes contradict each other and they want to see how authors navigate it. Name the contradiction explicitly in both reviewer responses. Choose the recommendation that better serves the paper, justifying the choice with reference to the journal's scope or the paper's core argument. Make a partial accommodation to the other reviewer in a different part of the manuscript (e.g., if you expand theory, cut something else). Frame this as a deliberate editorial judgment, not a failure to comply.

### Hostile, Abusive, or Clearly Unfair Reviews
Some reviewers are contemptuous in tone, set impossible standards, or demand changes that would turn the paper into a different study. Do not mention the tone in your response. Do not describe the review as unfair. Extract the substantive concern that exists within or beneath the hostile language, address it, and respond as if the comment had been written professionally. The editor knows when a review is unfair -- they read it too. Your job is to demonstrate restraint and judgment, which will strengthen the editor's inclination toward acceptance. If the review contains no substantive content and is purely abusive, address the letter to the editor directly, privately, outside the formal response letter.

### When the Reviewer Is Factually Wrong
This is distinct from disagreement. A reviewer may misattribute a citation, cite a retracted paper, describe a statistical method incorrectly, or claim a finding that does not appear in the literature. Handle this with extreme care. Do not write "The reviewer is incorrect." Write: "We note that the reviewer may be referring to [specific thing], which [accurate description]. The relevant literature on this point [accurate summary with citations]. We have added [text] to p. X to clarify this for readers." This corrects the error while protecting the relationship. If the reviewer's factual error is load-bearing -- i.e., their entire objection rests on a misunderstanding of how a technique works -- this usually requires a longer methodological clarification paragraph, ideally cited from a textbook or methodological review paper.

### Very Large Review Packages (30+ Comments)
Some major revision decisions from top journals arrive with 30-50 discrete reviewer comments across 3-4 reviewers. These response letters can run 15-20 pages and take weeks to complete. In these cases: (1) Begin with the summary revision table, placed before the point-by-point responses, so the editor can assess the scope of revision at a glance. (2) Group minor comments (typos, awkward phrasing, formatting) into a single numbered item: "Minor Revisions: We have addressed the following minor comments made by Reviewer 1 (R1.7, R1.8, R1.9, R1.12): [list changes with locations]." (3) For comments that required no manuscript change (positive feedback, questions already answered in the paper), use a one-sentence acknowledgment with a pointer to the relevant location. (4) Keep the cover letter to one page regardless of the response letter length.

### Re-Submission After Previous Rejection Elsewhere
When a paper rejected at Journal A is submitted to Journal B, and Journal B's reviewers raise concerns that overlap with Journal A's reviewer comments, the author faces a dilemma: the revision may have addressed Journal A's concerns already. In the Journal B response letter, do not reveal the prior submission history unless directly asked (editorial confidentiality conventions vary). Respond to Journal B's reviewers on their own terms. If the author made changes during the Journal A-to-B revision, those changes are already in the submitted manuscript and need not be explained in the response letter -- only additional changes made during Journal B revision belong in the response letter.

### Requests for Substantial New Work During Revision
A reviewer asks for a new experiment, additional data collection, or a full analysis that was not part of the original manuscript. Before committing to this work, the author should consider writing to the editor directly to confirm whether the additional analysis is required for acceptance or merely suggested. Response letter phrasing for this situation: "The reviewer requests [specific new analysis]. We have conducted this analysis and report the results in [location]." If the analysis is not feasible (data no longer available, the experiment would require IRB re-approval, etc.), the response must explain why, propose the closest feasible alternative, and explicitly acknowledge the limitation this creates. Editors will not always require infeasible analyses, but they must be told why the analysis cannot be done.

### When the Same Paper Has Been Through Multiple Rounds of Review
By the third or fourth round of review, the response letter must reference previous rounds explicitly. Use notation like "R3: Previously R2.1" to show continuity. Reviewers in later rounds are often checking whether previous concerns were adequately addressed -- they will compare your current response to prior response letters if they are available. Make sure that your current responses are consistent with your previous responses. If you are revising a position you took in a prior round, acknowledge this explicitly: "In our previous response, we argued [X]. After further consideration and in light of Reviewer 1's continued concern, we have revised our position and now [Y]."

### Response Letters for Preregistered Studies
For registered reports or preregistered studies, a reviewer cannot ask the authors to change the analysis plan after data collection. This creates a special case where disagreement is not just preferable but methodologically mandatory. The response should note: "Because this study followed a preregistered analysis plan (registration ID: [ID]), we are unable to modify [specific analysis] as suggested, as doing so after data collection would constitute HARKing (Hypothesizing After Results are Known). We have added an explanation of this constraint to the methods section (p. X, lines Y-Z) and we have included the requested analysis as an exploratory, non-preregistered supplement." This framing converts an apparent non-compliance into a demonstration of methodological integrity.

---

## Example

**Scenario:** A quantitative social science paper on political polarization has received a major revision decision from a mid-tier political science journal. The paper uses a two-wave panel survey with 487 respondents to test whether exposure to cross-cutting content on social media reduces affective polarization. Reviewer 2 has raised three concerns: (1) the sample is not nationally representative, (2) the causal interpretation of panel data is overstated, and (3) the operationalization of "affective polarization" combines two conceptually distinct constructs.

---

**Input provided by user:** "Here are the three comments from Reviewer 2 of my political science paper on social media and polarization. The sample is from a convenience panel (Lucid), n=487, two-wave design, 4 weeks between waves. I measured affective polarization using both feeling thermometers and social distance items combined into a single index. The main analysis is an OLS regression with lagged DV control. I can't get new data, and I'm not going to change the main analysis, but I'm open to adding robustness checks and discussing limitations more. Help me write the responses."

**Reviewer 2 Comments:**

> **R2.1:** "The authors use a Lucid convenience sample and claim generalizability to the American public. Lucid samples are known to differ from nationally representative samples on several key dimensions, including political interest and digital media literacy. The authors should either collect a nationally representative sample or substantially qualify their generalizability claims."

> **R2.2:** "The authors treat their two-wave panel design as establishing causal evidence for their hypotheses. However, panel data without experimental manipulation cannot establish causation. The authors should reframe their claims as correlational."

> **R2.3:** "The authors combine feeling thermometer scores and social distance items into a single affective polarization index. These two constructs have been shown to have different antecedents and to respond differently to interventions. Combining them obscures potentially important heterogeneity. The scale should be disaggregated."

---

**Output:**

---

### Response to Reviewer 2

We thank Reviewer 2 for these substantive methodological concerns, which have led to significant clarifications and improvements in the revised manuscript.

---

**R2.1**

> *"The authors use a Lucid convenience sample and claim generalizability to the American public. Lucid samples are known to differ from nationally representative samples on several key dimensions, including political interest and digital media literacy. The authors should either collect a nationally representative sample or substantially qualify their generalizability claims."*

**Response: We partially agree, and have substantially revised the generalizability claims throughout the manuscript.**

The reviewer correctly identifies a limitation of convenience panel samples, and we take this concern seriously. Collecting a new nationally representative sample is not feasible at this stage of the project, but we have made three substantive changes to address the underlying concern.

First, we have revised all generalizability language throughout the manuscript. The original text included three instances of "the American public" as the implied reference population (p. 4 lines 12, 18; p. 14 line 6). We have replaced these with "our sample of online political information consumers" and added a sentence in the introduction noting the population boundary: "Our findings should be understood as applying to the population of U.S. adults who regularly consume political content online and who are accessible through opt-in online panels, a group that is disproportionately politically interested and digitally engaged relative to the general population" (p. 4, lines 10-14).

Second, we have added a comparison of our sample demographics against the 2022 American National Election Study (ANES) pilot in a new Supplementary Table S1. Our sample overrepresents college-educated respondents (67% vs. 42% ANES) and skews slightly younger (median age 38 vs. 47 ANES), consistent with the reviewer's concern. We discuss these differences in the limitations section (p. 16, lines 4-12).

Third, we note that Lucid samples, while not nationally representative, have demonstrated criterion validity in studies of political attitudes. Coppock and McClellan (2019, *Political Communication*) found that treatment effects from Lucid samples replicate in population-based samples in 16 of 19 experimental comparisons. While our study is observational rather than experimental, this evidence base suggests that Lucid samples are not uniquely unsuitable for attitude research. We have added this citation and context to the methods section (p. 7, lines 20-24).

We respectfully maintain that the sample is appropriate for testing the theoretical relationships of interest, provided generalizability claims are appropriately bounded -- as we have now done throughout the manuscript.

---

**R2.2**

> *"The authors treat their two-wave panel design as establishing causal evidence for their hypotheses. However, panel data without experimental manipulation cannot establish causation. The authors should reframe their claims as correlational."*

**Response: We agree that our original causal language was too strong, and have revised it. We respectfully maintain, however, that panel data with lagged dependent variable controls provides stronger evidence than cross-sectional correlation, and have revised the manuscript to reflect this distinction accurately.**

The reviewer is correct that we cannot establish causation through observational panel data alone. We have revised all instances of causal language throughout the manuscript. Specifically, we replaced "our findings demonstrate that cross-cutting exposure reduces affective polarization" (originally p. 2, line 8; p. 13, line 14; p. 15, line 3) with "our findings are consistent with the hypothesis that cross-cutting exposure is associated with reduced affective polarization, controlling for prior polarization levels" in all three locations.

We have also revised the framing in the abstract (p. 1, lines 8-12) and the discussion opening (p. 13, lines 1-5) to use consistently associational language.

At the same time, we ask the reviewer to consider that our two-wave panel design with a lagged dependent variable (LDV) control offers meaningful advantages over cross-sectional analysis. The LDV model (OLS regressing Wave 2 polarization on Wave 1 polarization and Wave 1 cross-cutting exposure) controls for pre-existing levels of the outcome, making reverse causality less plausible than in a single cross-section. We have added the following clarification to the methods section to explain this to readers (p. 8, lines 15-21):

> *"We use a lagged dependent variable (LDV) model rather than a cross-sectional design, which partially addresses concerns about reverse causality by conditioning on the respondent's baseline level of affective polarization. We do not claim that this establishes strict causal identification; rather, we follow Finkel's (1995) recommendation that LDV models provide appropriate conservative tests of change hypotheses when experimental manipulation is not feasible. Readers should interpret our findings as consistent with a causal mechanism, pending experimental confirmation."*

We believe this framing accurately characterizes both the strength and limitations of our design.

---

**R2.3**

> *"The authors combine feeling thermometer scores and social distance items into a single affective polarization index. These two constructs have been shown to have different antecedents and to respond differently to interventions. Combining them obscures potentially important heterogeneity. The scale should be disaggregated."*

**Response: We agree. We have disaggregated the affective polarization index into its two components and report results for both throughout the manuscript.**

This is a well-taken and important concern. The reviewer is correct that feeling thermometer-based measures and social distance measures of affective polarization are conceptually distinct, as established by Druckman and Levendusky (2019, *Public Opinion Quarterly*) and Iyengar et al. (2019, *Annual Review of Political Science*). Combining them into a single index, as we did originally, may have obscured differential effects on emotional vs. social dimensions of polarization.

We have made the following revisions:

1. **Disaggregated analysis (p. 9-11):** We now report all analyses using three outcome variables: (a) the feeling thermometer-based measure alone, (b) the social distance measure alone, and (c) the combined index (retained as a robustness check). Tables 2, 3, and 4 have been restructured accordingly.

2. **Results reinterpretation (p. 13-14):** Cross-cutting exposure is associated with reduced feeling thermometer polarization (β = -0.14, SE = 0.04, p = .001) but shows a weaker, non-significant association with social distance polarization (β = -0.07, SE = 0.05, p = .16). This heterogeneity, which was invisible in our original combined index, is now a substantive finding in its own right. We discuss the theoretical implications of this divergence in the discussion (p. 14, lines 8-18), drawing on Druckman and Levendusky's (2019) argument that different dimensions of affective polarization may require different interventions.

3. **Measurement section revision (p. 7, lines 8-17):** We have revised the measurement section to describe the two sub-scales separately, report their individual alpha reliabilities (feeling thermometer α = .78; social distance α = .71), and note the moderate inter-scale correlation (r = .43, p < .001), which justifies examining them as related but distinct constructs.

We thank the reviewer for this suggestion. The disaggregated analysis produces a richer and more nuanced set of findings than our original composite approach, and we believe it substantially improves the paper.

---

**Completeness Check for Reviewer 2**

| Comment | Response Type | Revision Made | Location |
|---------|--------------|---------------|----------|
| R2.1 -- Sample generalizability | Partial agreement | Revised language (×3), added demographic comparison table, added Coppock & McClellan citation | p. 4 lines 10-14; p. 7 lines 20-24; p. 16 lines 4-12; Supp. Table S1 |
| R2.2 -- Causal language | Partial agreement | Revised causal language (×5), added LDV model explanation | p. 1, 2, 8, 13, 15 (specific lines above) |
| R2.3 -- Index disaggregation | Full agreement | Disaggregated analysis, restructured Tables 2-4, new results interpretation, revised measurement section | p. 7, 9-11, 13-14 |

- [x] All 3 Reviewer 2 comments addressed
- [x] All agreed revisions made in revised manuscript
- [x] Page/line numbers verified against final manuscript version
- [x] Tone reviewed: no defensive or dismissive language
- [x] Verbatim quotes match original review text
