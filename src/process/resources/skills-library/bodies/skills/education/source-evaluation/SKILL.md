---
name: source-evaluation
description: |
  Evaluates source credibility and relevance using the CRAAP test (Currency, Relevance, Authority, Accuracy, Purpose) and SIFT method for learners assessing research sources. Produces a completed evaluation with credibility ratings -- not a tutorial on critical thinking.
  Use when a learner asks to evaluate a source, check if a source is credible, assess research quality, or determine if a source is suitable for academic work.
  Do NOT use for finding sources (use `literature-search`), for citation formatting (use `citation-management`), or for writing about sources (use `annotated-bibliography`).
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
# Source Evaluation

## When to Use

Use this skill when a learner presents a specific source -- a journal article, website, book, report, video, or any information artifact -- and asks you to assess whether it is credible, reliable, or appropriate for academic work.

**Trigger scenarios:**

- A student submits a URL or citation and asks "Is this a good source for my paper on climate policy?"
- A learner asks "Can I use Wikipedia as a source for my thesis?"
- A researcher asks you to check whether a journal article is peer-reviewed and trustworthy
- A student asks whether a news article or government report is appropriate for a college-level assignment
- A learner is unsure if a source they found on Google Scholar is legitimate or predatory
- A student asks you to rate the credibility of a specific source on a 1--5 scale
- A learner asks whether two conflicting sources can both be trusted and how to decide between them
- A student asks whether a source published 15 years ago is still usable for a fast-moving field like genomics or AI policy

**Do NOT use when:**

- The user wants help finding sources -- use `literature-search` instead
- The user needs to format a citation in APA, MLA, or Chicago -- use `citation-management` instead
- The user wants to write a paragraph summarizing and commenting on a source -- use `annotated-bibliography` instead
- The user wants help synthesizing multiple sources into an argument -- use a synthesis or argument-construction skill instead
- The user is asking about media literacy or propaganda detection in a civic/non-academic context -- use a media literacy skill instead
- The user wants to build a research methodology framework -- use a research-design skill instead
- The user is an instructor designing a rubric for evaluating student-submitted sources -- use a curriculum-design or assessment skill instead

---

## Process

### Step 1: Extract the Source Details

Before running any evaluation framework, gather everything available about the source. Do not begin scoring until you have identified all findable metadata.

- Record the full citation if provided: author(s), title, publication name, volume/issue, year, publisher, URL or DOI
- Identify the **source type**: peer-reviewed journal article, conference paper, book chapter, edited volume, government report, think tank report, news article, website, blog post, preprint, gray literature, or social media content
- Source type determines which evaluation lens applies most heavily -- a preprint is evaluated differently than a published systematic review
- If the user has only provided a URL, extract the domain, author, publication date, and publisher from the page before scoring
- If the user has only provided a title and partial information, note which fields are missing and flag them as evaluation gaps
- Distinguish between the **publisher** (e.g., Elsevier, Nature Publishing Group, WHO) and the **outlet** (e.g., The Lancet, PLOS ONE, The New England Journal of Medicine) -- both matter independently

### Step 2: Apply the CRAAP Test Systematically

Score each of the five CRAAP criteria on a 1--5 scale using specific evidence from the source. Do not assign scores by impression alone -- cite specific features of the source as justification.

**Currency (C):**
- Determine the original publication date and, for websites or reports, the last-updated date
- Apply field-specific currency thresholds: hard sciences, technology, and medicine typically require sources from the last 5--7 years; social sciences and law allow 10--15 years; humanities may accept sources from 20+ years ago if they are primary texts or foundational scholarship
- Flag superseded research: a nutrition study from 1985 on fat intake is almost certainly outdated given subsequent meta-analyses; a 2002 philosophy paper on free will may still be foundational
- A score of 5 = published within the appropriate recency window with no signs of outdated data; 1 = clearly outdated, references superseded data, or no date is given at all

**Relevance (R):**
- Measure relevance against the user's specific research question, not against a general topic area
- Assess the **depth of coverage**: does the source address the user's exact question, or only a tangential aspect?
- Check the intended audience: a source written for policymakers uses different evidence standards than one written for biomedical researchers; a popular science article intended for a general audience is not the same as a primary study
- A score of 5 = directly addresses the research question, appropriate audience level, substantial coverage; 1 = only tangentially related or written for a very different audience with no overlap

**Authority (A):**
- Investigate the author's credentials: academic position, institutional affiliation, publication history, relevant degrees
- Distinguish between **domain authority** (credentials in the specific subfield) and **general authority** (being a known public figure)
- Check the publisher: is the journal indexed in Web of Science, Scopus, or PubMed? Is the book publisher a recognized academic press (MIT Press, Cambridge University Press, Oxford University Press)? Is the report from a peer-recognized institution (CDC, World Bank, Cochrane Collaboration)?
- Check whether the journal is listed on Beall's list criteria for predatory publishers -- signs include: article processing charges with guaranteed acceptance, editorial boards with fake or stolen names, implausibly broad scope, pressure to submit
- A score of 5 = named expert with relevant credentials, respected publisher with editorial oversight; 1 = anonymous author, no institutional affiliation, self-published or predatory outlet

**Accuracy (A):**
- Examine whether claims are supported by citations to primary sources
- Check for internal consistency: do the conclusions match the data presented?
- Assess methodology if it is a research study: sample size, control conditions, statistical methods, peer-review status
- Look for corrections, retractions, or post-publication critiques (PubPeer, Retraction Watch are standard sources for this)
- Distinguish between **peer-reviewed** (pre-publication review by subject-matter experts) and **editorial review** (fact-checking by journalists or staff editors) -- both have value but serve different evidence standards
- A score of 5 = peer-reviewed, well-cited, methodology transparent and sound, no known retractions; 1 = no citations, anecdotal claims, retracted, or methodology fundamentally flawed

**Purpose (P):**
- Identify the intended function of the source: inform, persuade, advocate, sell, entertain, or deceive
- Check funding and affiliation disclosures: industry-funded studies on their own products require extra scrutiny even when published in legitimate journals
- Look for loaded language, selective use of evidence, or presentation of contested claims as settled consensus
- Distinguish between **advocacy with transparent disclosure** (a policy brief from a named think tank stating its ideological stance) and **hidden advocacy** (a website presenting industry-funded data without disclosing the funder)
- A score of 5 = informational with transparent purpose, no undisclosed conflicts of interest; 1 = clearly promotional, hidden agenda, deceptive presentation

### Step 3: Apply the SIFT Method as a Cross-Check

After scoring CRAAP, apply the SIFT method as a rapid-validation layer, particularly for online sources and sources where authority is uncertain.

- **Stop**: Before accepting any claim in the source, pause. Identify the most important claim the user plans to use from this source
- **Investigate the source**: Spend time looking at what others say about this publication or publisher -- not the content itself, but the source's reputation. A Google search for "[journal name] predatory" or "[author name] retraction" can surface issues in seconds
- **Find better coverage**: Search for the same core claim or data in two or three other independent sources. If the claim appears only in this one source, that is a significant credibility concern. If it is corroborated across peer-reviewed literature and reputable institutions, confidence rises
- **Trace claims to origin**: Follow the citation chain. If the source cites "a recent study showing X," find that study and read what it actually says. Misrepresentation of cited sources is one of the most common accuracy failures, especially in news articles and advocacy reports
- SIFT is particularly valuable for evaluating websites, social media sources, and news articles where CRAAP's Authority and Accuracy criteria are harder to assess

### Step 4: Calculate Overall Score and Assign Credibility Rating

- Average the five CRAAP scores to produce a composite score (1.0--5.0)
- Apply the credibility rating thresholds:
  - **4.0--5.0 = High Credibility** -- Suitable for academic use with standard citation practices
  - **3.0--3.9 = Moderate Credibility** -- Usable with explicit caveats; should be corroborated by higher-credibility sources; do not use as the sole support for a major claim
  - **2.0--2.9 = Low Credibility** -- Not suitable for academic argument; may be cited as an example of a perspective or to document a claim's existence, but cannot serve as evidence
  - **1.0--1.9 = Not Credible** -- Should not appear in academic work in any supporting role; flag as misinformation risk if the user plans to use it
- Note that a single criterion scoring 1 can disqualify a source even if the average is higher -- a retracted article (Accuracy = 1) is not redeemable by high scores on other criteria

### Step 5: Assess Academic Usability

Beyond raw credibility, determine whether this source is appropriate for the user's specific academic context.

- Identify the **assignment or disciplinary requirements**: some fields (law, medicine, clinical psychology) have strict hierarchies of evidence where systematic reviews and RCTs outrank all other source types; the humanities accept primary texts, literary criticism, and archival sources as authoritative
- Match the source to the **citation level**: a first-year undergraduate essay has different source quality expectations than a doctoral dissertation literature review
- Assess whether the source is **primary, secondary, or tertiary**: a primary source (the original study, the original text) is almost always preferable to a secondary source (a review or summary), which is preferable to a tertiary source (an encyclopedia or textbook overview) for making specific evidential claims
- Flag any discipline-specific concerns: using a psychology study from a WEIRD sample (Western, Educated, Industrialized, Rich, Democratic) to support claims about universal human behavior; using a US-centric policy report for a comparative international analysis

### Step 6: Deliver the Evaluation with the Completed Scorecard

Produce the completed evaluation using the output format below. Do not ask the user to fill in a worksheet -- you fill it in. Every field must be populated with specific evidence from the source.

- Lead with the Overall Credibility Rating in plain language before the detailed scorecard
- For each criterion, provide one to three specific evidence points that justify the score -- not generic descriptions of what the criterion means
- Conclude with a clear, unambiguous usability verdict: use, use with caution, or exclude -- and explain why in one to two sentences
- If the evaluation reveals that the source is weak on one criterion but strong overall, advise specifically how to use the source responsibly (e.g., "Cite this for the historical context section but do not rely on it for the statistical claims")

### Step 7: Provide Actionable Next Steps

- If the source is excluded or marginal, suggest the type of source that would serve the user's need better (e.g., "For this claim, look for a systematic review published in the last 5 years in a medical journal indexed in PubMed")
- If the source is high credibility, note any responsible-use considerations (e.g., proper contextualization of a study's scope limitations)
- If the user has multiple sources to evaluate, recommend they run the same process and compare scores before deciding which sources to anchor their argument on
- Connect to complementary skills: if the source passes evaluation, the user may next need `annotated-bibliography` or `citation-management`

---

## Output Format

```
## Source Evaluation Report

**Source:** [Full citation: Author(s). (Year). Title. Publication/Publisher. DOI or URL]
**Source Type:** [Peer-reviewed article / Book chapter / Government report / Website / News article / Preprint / Other]
**Evaluated for:** [User's research topic or assignment]
**Evaluator Date:** [Date of evaluation]

---

### OVERALL CREDIBILITY RATING: [HIGH / MODERATE / LOW / NOT CREDIBLE]
**Composite CRAAP Score:** [X.X / 5.0]

[One to two sentences summarizing the verdict in plain language before the detailed breakdown.]

---

### CRAAP Scorecard

| Criterion | Score (1–5) | Key Evidence |
|-----------|-------------|--------------|
| Currency | [X] | [Specific publication date, field recency standard, and whether the source meets it] |
| Relevance | [X] | [How directly the source addresses the research question; intended audience match] |
| Authority | [X] | [Author credentials, institutional affiliation, publisher credibility, indexing status] |
| Accuracy | [X] | [Peer-review status, citation practices, methodology quality, retraction status] |
| Purpose | [X] | [Stated and apparent purpose; funding disclosures; language tone; conflict of interest] |
| **COMPOSITE** | **[X.X]** | |

**Credibility Tier:** [High (4.0–5.0) / Moderate (3.0–3.9) / Low (2.0–2.9) / Not Credible (1.0–1.9)]

---

### SIFT Cross-Check

| SIFT Step | Finding |
|-----------|---------|
| Stop (claim identified) | [The specific claim from this source the user plans to use] |
| Investigate (source reputation) | [What independent investigation of the outlet/author revealed] |
| Find better coverage | [Whether this claim is corroborated in independent sources] |
| Trace claims to origin | [Whether citations in the source accurately represent the original material] |

**SIFT Assessment:** [Supports / Qualifies / Contradicts the CRAAP rating]

---

### Academic Usability Assessment

**Discipline:** [Field of study]
**Assignment Level:** [First-year undergraduate / Upper-division / Graduate / Professional]
**Source Role:** [Primary / Secondary / Tertiary]
**Evidence Hierarchy Fit:** [How this source ranks within the discipline's evidence standards]

**Usability Verdict:**
- [ ] ✅ **USE** -- Suitable for academic citation without additional caveats
- [ ] ⚠️ **USE WITH CAUTION** -- Usable under the following conditions: [specific conditions]
- [ ] ❌ **EXCLUDE** -- Reason: [specific reason; recommended alternative source type]

---

### Specific Usage Guidance

**Appropriate uses of this source:**
- [Specific claim or section it can support]
- [Specific section of the user's paper where it is appropriate]

**Inappropriate uses of this source:**
- [Specific claim or argument it cannot support and why]

---

### Red Flags Identified (if any)

| Flag | Severity | Details |
|------|----------|---------|
| [Flag 1 -- e.g., No peer review] | [High/Medium/Low] | [Specific detail] |
| [Flag 2 -- e.g., Industry funding] | [High/Medium/Low] | [Specific detail] |

*(Omit this section if no red flags were identified.)*

---

### Next Steps

1. [Immediate action -- e.g., "Search PubMed for a systematic review on X to corroborate the statistics cited here"]
2. [If source passes: "Proceed to annotation using the annotated-bibliography skill"]
3. [If source fails: "Use this source type instead: [description], and apply these search terms: [terms]"]
```

---

## Rules

1. **Never produce a blank worksheet for the user to fill in.** The entire scorecard must be completed with specific evidence drawn from the source. If information is unavailable, note it explicitly as "Not available -- score penalized" and explain how it affected the rating.

2. **Apply field-appropriate currency thresholds.** A chemistry or machine learning source from 2015 may be outdated; a 1985 primary historical document is not. Never use a universal cutoff date -- always specify why the date is or is not acceptable for the user's field.

3. **Distinguish between journal credibility and article credibility.** A high-impact journal (Nature, JAMA, Science) can publish flawed studies, and a lower-impact journal can publish rigorous ones. Score the individual article's methodology and citation practices, not just the journal's prestige.

4. **A retracted source scores 1 on Accuracy and is automatically classified as Not Credible** regardless of other scores. Retraction status can be checked via Retraction Watch's database or a note on the DOI page. Flag retraction as a High-severity red flag.

5. **Do not confuse peer review with truth.** Peer review means expert pre-publication review, not guaranteed correctness. Communicate this clearly when a source is peer-reviewed but the user asks whether it is "definitely right."

6. **Predatory journals require explicit identification.** If a journal shows multiple predatory indicators -- guaranteed acceptance, no visible peer-review process, implausibly fast publication (under 2 weeks), article processing charges without institutional affiliation -- name the concern explicitly and score Authority at 1 or 2.

7. **Industry funding is a conflict of interest flag, not automatic disqualification.** A pharmaceutical study funded by the drug manufacturer should be noted, given a Purpose score deduction (typically 1--2 points from a baseline of 5), and the user should be advised to corroborate findings in independently funded replications.

8. **Wikipedia is a tertiary source.** It scores Moderate at best for Accuracy and Authority by academic standards. It is not citable as a primary or secondary source in academic work but may be a valid starting point for finding primary sources through its reference section. State this clearly and without dismissiveness.

9. **Gray literature requires explicit labeling.** Government reports, NGO publications, think tank papers, and white papers are not peer-reviewed but can be authoritative if produced by credible institutions (CDC, OECD, WHO, Cochrane). Score them accurately and explain to the user that "not peer-reviewed" does not mean "not credible" for gray literature from institutional sources.

10. **Never collapse the evaluation into a single adjective without justification.** "This is a credible source" is not an acceptable output. Every credibility rating must be followed by the scorecard, the evidence behind each score, and the usability verdict. Vague praise or dismissal without evidence fails the learner.

---

## Edge Cases

### The Source Has No Listed Author or Date

Missing author and missing date each independently reduce the credibility score -- Authority drops to 1 or 2, Currency cannot be assessed and defaults to a score of 2 (unknown). Run SIFT's Investigate step to determine if the domain itself (e.g., `.gov`, `.edu`, `.org`) provides sufficient institutional authority to partially compensate for the missing author. A CDC webpage with no individual author listed still carries institutional authority. A random `.com` page with no author and no date is Not Credible. State the limitations explicitly and mark the relevant cells "Not available -- scoring penalized."

### The Source Is a Preprint (Not Yet Peer-Reviewed)

Preprints posted to repositories such as arXiv, bioRxiv, SSRN, or medRxiv have not undergone peer review. Score Accuracy at 2 by default and note that the methodology may change before publication. Preprints became widely used during the COVID-19 pandemic and are now common in many fields. They can be cited with the explicit label "preprint, not peer-reviewed" and should always be corroborated by peer-reviewed literature. Advise the user to check whether the preprint has since been published in a peer-reviewed journal -- if so, locate and evaluate the published version instead.

### The Source Has Been Corrected but Not Retracted

Some journals issue corrections (errata) for specific figures, tables, or methodological details without retracting the entire paper. Locate the correction notice and assess whether the corrected element affects the specific claim the user wants to cite. If the correction changes the primary finding, treat it similarly to a retraction for the affected claim. If the correction is minor (e.g., a typographical error in a table that does not affect the conclusion), score Accuracy at 3--4 and note the correction in the red flags section at Low severity.

### The User Is Evaluating a Classic or Foundational Text

Seminal works -- Kuhn's The Structure of Scientific Revolutions, Freud's Interpretation of Dreams, Foucault's Discipline and Punish -- will score poorly on Currency by strict standards but remain academically essential. Apply a modified Currency assessment: score the original publication date in context (was it authoritative when published?), note that the field has developed since then, and clarify whether the user needs the foundational perspective itself or the current state of the field. For primary texts in the humanities, Currency is usually irrelevant; for empirical claims in a foundational psychology study, it may be central.

### Two Sources on the Same Topic Directly Contradict Each Other

Do not simply evaluate each source in isolation and leave the user with two contradictory high-credibility verdicts. After completing both evaluations, add a comparative note: identify which source is more recent, which has stronger methodology (larger sample, more rigorous study design, more independent replication), and which better aligns with the current consensus in the field. If the contradiction reflects a genuine ongoing scholarly debate, say so explicitly and advise the user to represent both perspectives in their writing rather than selecting one as definitively correct.

### The Source Is a Secondary News Article Citing a Study

Many students find studies through news coverage rather than the original research. In this case, evaluate the news article on its own terms (journalistic standards, not academic standards), then locate and evaluate the original study it describes. The news article may be useful as context or to demonstrate public discourse around a finding, but the original study should be the evidential source. Note this distinction in the Usability Assessment section. A common failure mode: the news headline overstates the study's conclusions -- the Trace Claims step of SIFT will often reveal this.

### The Source Is from a Think Tank or Advocacy Organization

Think tanks exist on a spectrum from policy-neutral to explicitly ideological. Organizations like the Brookings Institution, RAND Corporation, and the Urban Institute have strong peer-review-like internal processes and are widely cited in academic work. Organizations with less transparent methodology, undisclosed funding, or explicit advocacy missions require a lower Authority and Purpose score. Advise the user to identify the organization's funding sources (often available on their website's "About" or "Funding" page) and to treat the source as representing a perspective rather than neutral analysis. This does not automatically disqualify it -- a source representing a position can be cited as evidence of that position.

### The User Asks About a Source in a Language Other Than English

Non-English sources follow the same evaluation framework. Language does not affect credibility. Check whether the journal or publisher is indexed in international databases (Scopus, SciELO, CNKI for Chinese sources, J-STAGE for Japanese sources). Flag any difficulty in assessing accuracy or methodology due to language barriers, and advise the user to seek a bilingual subject librarian or peer for methodology verification if they are not fluent in the source language.

---

## Example

**Input:** "Can I use this source for my paper on the long-term mental health effects of social media use in adolescents? Here's the citation: Twenge, J. M., & Campbell, W. K. (2019). Media use is linked to lower psychological well-being: Evidence from three datasets. *Psychiatric Quarterly*, 90(2), 311--331."

---

## Source Evaluation Report

**Source:** Twenge, J. M., & Campbell, W. K. (2019). Media use is linked to lower psychological well-being: Evidence from three datasets. *Psychiatric Quarterly*, 90(2), 311--331.
**Source Type:** Peer-reviewed journal article
**Evaluated for:** Long-term mental health effects of social media use in adolescents
**Evaluator Date:** Current session

---

### OVERALL CREDIBILITY RATING: HIGH
**Composite CRAAP Score:** 4.2 / 5.0

This is a peer-reviewed article published in a legitimate psychiatric journal by credentialed researchers. It is directly relevant to the topic and provides multi-dataset empirical evidence. One important caveat applies: the study uses cross-sectional and correlational data, which limits causal claims -- the user should not cite this article as proving social media causes mental health decline.

---

### CRAAP Scorecard

| Criterion | Score (1–5) | Key Evidence |
|-----------|-------------|--------------|
| Currency | 4 | Published 2019 -- within the standard 5--7 year window for social and developmental psychology. The social media landscape has evolved since 2019 (TikTok growth, platform algorithm changes), so findings may not fully generalize to 2023--2025 adolescent use patterns. Adequate but not cutting-edge. |
| Relevance | 5 | Directly addresses the research question: media use (including social media) and psychological well-being in youth. Three large datasets covering U.S. adolescents and young adults. Written for a psychiatric/psychological research audience, appropriate for an academic paper on this topic. |
| Authority | 4 | Jean Twenge is a professor of psychology at San Diego State University with an extensive publication record on generational trends and adolescent mental health, including the widely cited book iGen (2017). W. Keith Campbell is a professor at the University of Georgia. *Psychiatric Quarterly* is indexed in PubMed and Scopus. Minor deduction: Twenge's broader work on this topic has been contested by other researchers (notably Amy Orben and Andrew Przybylski), which means the user should present this as one perspective in an ongoing debate. |
| Accuracy | 4 | Three national datasets used (Monitoring the Future, Youth Risk Behavior Surveillance System, National Survey on Children's Health). Methodology is transparent. Statistical tests (regression analyses) reported with effect sizes. Citations are to peer-reviewed primary studies. Key limitation: all three datasets are cross-sectional, meaning the study cannot establish causality -- this is acknowledged by the authors. No known retraction or correction. Score docked one point for the well-documented replication concerns around correlational magnitude in this literature. |
| Purpose | 4 | Published to contribute to empirical literature on media use and mental health. No pharmaceutical or commercial funding disclosed. The authors have a visible theoretical position (generational shift thesis) but disclose their perspective and acknowledge limitations. Purpose is academic, not commercial or advocacy-driven. Minor note: Twenge has been publicly vocal on this topic in media appearances, which warrants awareness of potential confirmation bias in framing, though it does not undermine the data. |
| **COMPOSITE** | **4.2** | |

**Credibility Tier:** High (4.0--5.0)

---

### SIFT Cross-Check

| SIFT Step | Finding |
|-----------|---------|
| Stop (claim identified) | The user may want to cite this for the claim that social media use is associated with lower psychological well-being in adolescents. |
| Investigate (source reputation) | *Psychiatric Quarterly* is a Springer-published, PubMed-indexed journal founded in 1926. Twenge's work is widely cited (thousands of citations on Google Scholar) but has also been critically examined in high-profile responses, notably Orben & Przybylski (2019) in Nature Human Behaviour, who found effect sizes so small as to be practically negligible. The debate is active and genuine. |
| Find better coverage | The association between social media and adolescent well-being is reported across multiple studies (Coyne et al., 2020; Odgers & Jensen, 2020; Haidt & Allen, 2020), but the direction and magnitude are actively contested. The claim is corroborated in existence but disputed in strength and causality. |
| Trace claims to origin | The three datasets cited are publicly available government surveys. The authors' use of pre-existing datasets rather than proprietary data increases replicability. However, the operationalization of "media use" relies on self-report items from surveys not designed specifically to measure social media, which the authors note. |

**SIFT Assessment:** Qualifies the CRAAP rating -- the source is credible but sits within a contested literature; it cannot be cited as settling the debate.

---

### Academic Usability Assessment

**Discipline:** Psychology / Public Health / Adolescent Development
**Assignment Level:** Upper-division undergraduate or graduate
**Source Role:** Secondary empirical (large-dataset analysis)
**Evidence Hierarchy Fit:** Strong within correlational psychological research; below the level of a longitudinal study or randomized experiment in the evidence hierarchy. For clinical claims, a systematic review would outrank this.

**Usability Verdict:**
- [x] ⚠️ **USE WITH CAUTION** -- Suitable for academic citation when presented as evidence of a correlational association, not as proof of causation. Must be contextualized within the ongoing scholarly debate; cite alongside at least one contrasting study (e.g., Orben & Przybylski, 2019) to represent the literature accurately.

---

### Specific Usage Guidance

**Appropriate uses of this source:**
- Citing as evidence that researchers have found a negative correlation between media use and adolescent psychological well-being using large national datasets
- Introducing the empirical debate in a literature review section ("Twenge & Campbell, 2019, found that...")
- Supporting a discussion of methodology in correlational research and its limits
- Providing context for why social media and adolescent mental health has become a major policy and research concern

**Inappropriate uses of this source:**
- Claiming that "social media causes depression in teenagers" -- the study's cross-sectional design does not support causal language
- Using this as the sole empirical support for a major argument about harmful effects without acknowledging Orben & Przybylski's reanalysis of similar data
- Generalizing findings to post-2020 adolescent social media use, particularly short-form video platforms, which were not well-represented in the 2019 datasets

---

### Red Flags Identified

| Flag | Severity | Details |
|------|----------|---------|
| Cross-sectional design only | Medium | Cannot establish causality; limits the strength of causal claims the user can make |
| Active scholarly controversy over effect sizes | Medium | Orben & Przybylski (2019, Nature Human Behaviour) reanalyzed comparable data and found effect sizes comparable to wearing glasses or eating potatoes -- the user must represent both perspectives |
| Self-report media use measures | Low | Datasets used general screen time questions, not platform-specific social media measures; limits precision of the findings |

---

### Next Steps

1. **Immediately**: Locate and evaluate Orben, A., & Przybylski, A. K. (2019). The association between adolescent well-being and digital technology use. *Nature Human Behaviour*, 3(2), 173--182 -- this is the most prominent critical response and should be cited alongside Twenge & Campbell if you are making claims about the strength of the association.
2. **For stronger causal evidence**: Search PubMed for longitudinal studies on social media use and adolescent depression published after 2020 using the search terms: "social media" AND "adolescent" AND "depression" AND ("longitudinal" OR "cohort study"). These will rank higher in the evidence hierarchy than cross-sectional analyses.
3. **For writing**: Once you have 3--4 sources evaluated and selected, use the `annotated-bibliography` skill to build concise summaries and synthesis notes, then use `citation-management` for APA 7th edition formatting.
